import { produtos, stacks, stackProdutos, configuracaoSite, sessaoAdmin, type Produto, type Stack, type StackProduto, type InsertProduto, type InsertStack, type InsertStackProduto, type InsertConfiguracaoSite, type InsertSessaoAdmin, categorias, categoriaProdutos, InsertCategoria, Categoria, InsertCategoriaProduto, CategoriaProduto } from "../shared/schema.js";
import { db } from "./db.js";
import { eq, desc, asc, and, ilike, or, max, count, inArray } from "drizzle-orm";
import { SUPABASE_BUCKET_PRODUTOS } from "../shared/constants.js";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase URL and Service Role Key must be defined in your .env file');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

export interface IStorage {
  // Produtos
  getProdutos(search?: string, page?: number, limit?: number, stackId?: string, categoryId?: string, includeInactive?: boolean): Promise<{ produtos: Produto[], total: number }>;
  getProdutoById(id: string): Promise<(Produto & { categorias: Categoria[] }) | undefined>;
  createProduto(produto: InsertProduto, categoriaIds?: string[]): Promise<Produto>;
  updateProduto(id: string, produto: Partial<InsertProduto>, categoriaIds?: string[]): Promise<Produto>;
  toggleProdutoStatus(id: string): Promise<Produto>;
  deleteProduto(id: string): Promise<void>;

  // Stacks
  getStacks(includeInactive?: boolean): Promise<(Stack & { produtos: (StackProduto & { produto: Produto })[] })[]>;
  getStackById(id: string): Promise<Stack | undefined>;
  createStack(stack: InsertStack, produtos?: { productId: string, ordem: number }[]): Promise<Stack>;
  updateStack(id: string, stack: Partial<InsertStack>, produtosData?: { productId: string, ordem: number }[]): Promise<Stack>;
  toggleStackStatus(id: string): Promise<Stack>;
  deleteStack(id: string): Promise<void>;
  reorderStacks(stacksToReorder: { id: string; ordem: number }[]): Promise<void>;

  // Stack Produtos
  addProdutoToStack(stackProduto: InsertStackProduto): Promise<StackProduto>;
  removeProdutoFromStack(stackId: string, produtoId: string): Promise<void>;
  updateStackProdutoOrdem(id: string, ordem: number): Promise<StackProduto>;

  // Categorias
  getCategorias(includeInactive?: boolean): Promise<Categoria[]>;
  getCategoriaById(id: string): Promise<Categoria | undefined>;
  createCategoria(categoria: InsertCategoria): Promise<Categoria>;
  updateCategoria(id: string, categoria: Partial<InsertCategoria>): Promise<Categoria>;
  toggleCategoriaStatus(id: string): Promise<Categoria>;
  deleteCategoria(id: string): Promise<void>;
  addCategoriaToProduto(categoriaProduto: InsertCategoriaProduto): Promise<CategoriaProduto>;
  removeCategoriaFromProduto(categoriaId: string, produtoId: string): Promise<void>;
  updateProdutoCategorias(produtoId: string, categoriaIds: string[]): Promise<void>;

  // Configuração
  getConfiguracao(chave: string): Promise<string | undefined>;
  setConfiguracao(config: InsertConfiguracaoSite): Promise<void>;

  // Admin
  createSessaoAdmin(sessao: InsertSessaoAdmin): Promise<string>;
  validateSessaoAdmin(token: string): Promise<boolean>;
  deleteSessaoAdmin(token: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getProdutos(search?: string, page: number = 1, limit: number = 20, stackId?: string, categoryId?: string, includeInactive: boolean = false): Promise<{ produtos: (Produto & { categorias: Categoria[] })[], total: number }> {
    const offset = (page - 1) * limit;

    const baseConditions = [];
    if (!includeInactive) {
      baseConditions.push(eq(produtos.ativo, true));
    }
    if (search) {
      baseConditions.push(or(
        ilike(produtos.titulo, `%${search}%`),
        ilike(produtos.id, `%${search}%`)
      ));
    }

    let query = db.select({
      produto: produtos,
      categoria: categorias, // Select category data
    })
    .from(produtos)
    .leftJoin(categoriaProdutos, eq(produtos.id, categoriaProdutos.produtoId))
    .leftJoin(categorias, eq(categoriaProdutos.categoriaId, categorias.id))
    .$dynamic();

    let countQuery = db.select({ value: count() }).from(produtos).$dynamic();

    if (stackId) {
      query = db.select({
        produto: produtos,
        categoria: categorias,
      })
      .from(produtos)
      .innerJoin(stackProdutos, eq(produtos.id, stackProdutos.produtoId))
      .leftJoin(categoriaProdutos, eq(produtos.id, categoriaProdutos.produtoId))
      .leftJoin(categorias, eq(categoriaProdutos.categoriaId, categorias.id))
      .where(eq(stackProdutos.stackId, stackId))
      .$dynamic();

      countQuery = db.select({ value: count() }).from(produtos).innerJoin(stackProdutos, eq(produtos.id, stackProdutos.produtoId)).where(eq(stackProdutos.stackId, stackId)).$dynamic();
    }

    if (categoryId) {
      query = db.select({
        produto: produtos,
        categoria: categorias,
      })
      .from(produtos)
      .innerJoin(categoriaProdutos, eq(produtos.id, categoriaProdutos.produtoId))
      .leftJoin(categorias, eq(categoriaProdutos.categoriaId, categorias.id))
      .where(eq(categoriaProdutos.categoriaId, categoryId))
      .$dynamic();

      countQuery = db.select({ value: count() }).from(produtos).innerJoin(categoriaProdutos, eq(produtos.id, categoriaProdutos.produtoId)).where(eq(categoriaProdutos.categoriaId, categoryId)).$dynamic();
    }

    const whereClause = baseConditions.length > 0 ? and(...baseConditions) : undefined;

    const [rawProdutosList, countResult] = await Promise.all([
      query.where(whereClause).limit(limit).offset(offset).orderBy(asc(produtos.titulo)),
      countQuery.where(whereClause)
    ]);

    // Manually group categories for each product
    const produtosMap = new Map<string, Produto & { categorias: Categoria[] }>();

    rawProdutosList.forEach(row => {
      const produto = row.produto;
      const categoria = row.categoria;

      if (!produtosMap.has(produto.id)) {
        produtosMap.set(produto.id, { ...produto, categorias: [] });
      }
      if (categoria) { // Only add if category exists (for products without categories)
        produtosMap.get(produto.id)?.categorias.push(categoria);
      }
    });

    const produtosList = Array.from(produtosMap.values());

    return {
      produtos: produtosList,
      total: countResult[0]?.value || 0
    };
  }

  async getProdutoById(id: string): Promise<(Produto & { categorias: Categoria[] }) | undefined> {
    const [produto] = await db.select().from(produtos).where(eq(produtos.id, id));
    if (!produto) return undefined;

    const produtoCategorias = await db.select({ ...categorias }).from(categorias)
      .innerJoin(categoriaProdutos, eq(categorias.id, categoriaProdutos.categoriaId))
      .where(eq(categoriaProdutos.produtoId, id));

    return { ...produto, categorias: produtoCategorias };
  }

  async createProduto(produto: InsertProduto, categoriaIds?: string[]): Promise<Produto> {
    const descontoCalculado = produto.valorBruto && produto.valorDesconto
      ? Math.round(((produto.valorBruto - produto.valorDesconto) / produto.valorBruto) * 100)
      : 0;

    const [novoProduto] = await db
      .insert(produtos)
      .values({
        ...produto,
        descontoCalculado,
        atualizadoEm: new Date()
      })
      .returning();

    if (categoriaIds && categoriaIds.length > 0) {
      await this.updateProdutoCategorias(novoProduto.id, categoriaIds);
    }

    return novoProduto;
  }

  async updateProduto(id: string, produto: Partial<InsertProduto>, categoriaIds?: string[]): Promise<Produto> {
    const descontoCalculado = produto.valorBruto && produto.valorDesconto
      ? Math.round(((produto.valorBruto - produto.valorDesconto) / produto.valorBruto) * 100)
      : undefined;

    const [produtoAtualizado] = await db
      .update(produtos)
      .set({
        ...produto,
        ...(descontoCalculado !== undefined && { descontoCalculado }),
        atualizadoEm: new Date()
      })
      .where(eq(produtos.id, id))
      .returning();

    if (categoriaIds) {
      await this.updateProdutoCategorias(id, categoriaIds);
    }

    return produtoAtualizado;
  }

  async toggleProdutoStatus(id: string): Promise<Produto> {
    const [produto] = await db.select().from(produtos).where(eq(produtos.id, id));
    if (!produto) {
      throw new Error("Produto não encontrado");
    }
    const [produtoAtualizado] = await db
      .update(produtos)
      .set({
        ativo: !produto.ativo,
        atualizadoEm: new Date()
      })
      .where(eq(produtos.id, id))
      .returning();
    return produtoAtualizado;
  }

  async deleteProduto(id: string): Promise<void> {
    const produtoToDelete = await this.getProdutoById(id);
    if (!produtoToDelete) {
      throw new Error("Produto não encontrado");
    }

    if (produtoToDelete.fotos && produtoToDelete.fotos.length > 0) {
      const filePaths = produtoToDelete.fotos.map(url => {
        const parts = url.split("/");
        const bucketName = SUPABASE_BUCKET_PRODUTOS;
        const bucketNameIndex = parts.indexOf(bucketName);
        if (bucketNameIndex === -1) {
          console.error("Nome do bucket não encontrado na URL da imagem:", url);
          return '';
        }
        return parts.slice(bucketNameIndex + 1).join('/');
      });

      const { error: deleteError } = await supabaseAdmin.storage.from(
        SUPABASE_BUCKET_PRODUTOS,
      ).remove(filePaths);

      if (deleteError) {
        console.error("Erro ao deletar imagens do Supabase Storage:", deleteError);
      }
    }

    await db.delete(produtos).where(eq(produtos.id, id));
  }

  async getStacks(includeInactive: boolean = false): Promise<(Stack & { produtos: (StackProduto & { produto: Produto })[] })[]> {
    let stacksList: Stack[] = [];
    const query = db.select().from(stacks);
    if (!includeInactive) {
      query.where(eq(stacks.ativo, true));
    }
    stacksList = await query.orderBy(asc(stacks.ordem));

    let stacksWithProdutos = await Promise.all(
      stacksList.map(async (stack) => {
        const productConditions = [eq(stackProdutos.stackId, stack.id)];
        if (!includeInactive) {
          productConditions.push(eq(produtos.ativo, true));
        }

        const stackProdutosList = await db
          .select({
            stack_produtos: stackProdutos,
            produtos: produtos
          })
          .from(stackProdutos)
          .innerJoin(produtos, eq(stackProdutos.produtoId, produtos.id))
          .where(and(...productConditions))
          .orderBy(asc(stackProdutos.ordem));

        return {
          ...stack,
          produtos: stackProdutosList.map(item => ({
            ...item.stack_produtos,
            produto: item.produtos
          }))
        };
      })
    );

    if (!includeInactive) {
      stacksWithProdutos = stacksWithProdutos.filter(stack => stack.produtos.length > 0);
    }

    return stacksWithProdutos;
  }

  async getStackById(id: string): Promise<Stack | undefined> {
    const [stack] = await db.select().from(stacks).where(eq(stacks.id, id));
    return stack;
  }

  async createStack(stack: InsertStack, produtosData?: { productId: string, ordem: number }[]): Promise<Stack> {
    const maxOrderResult = await db.select({ maxOrder: max(stacks.ordem) }).from(stacks);
    const nextOrder = (maxOrderResult[0].maxOrder || 0) + 1;

    const [novaStack] = await db
      .insert(stacks)
      .values({
        ...stack,
        ordem: nextOrder,
        atualizadoEm: new Date()
      })
      .returning();

    if (produtosData && produtosData.length > 0) {
      const stackProdutosToInsert = produtosData.map(p => ({
        stackId: novaStack.id,
        produtoId: p.productId,
        ordem: p.ordem,
        criadoEm: new Date(),
      }));
      await db.insert(stackProdutos).values(stackProdutosToInsert);
    }

    return novaStack;
  }

  async updateStack(id: string, stack: Partial<InsertStack>, produtosData?: { productId: string, ordem: number }[]): Promise<Stack> {
    const [stackAtualizada] = await db
      .update(stacks)
      .set({
        ...stack,
        atualizadoEm: new Date()
      })
      .where(eq(stacks.id, id))
      .returning();

    if (produtosData !== undefined) {
      await db.delete(stackProdutos).where(eq(stackProdutos.stackId, id));

      if (produtosData.length > 0) {
        const stackProdutosToInsert = produtosData.map(p => ({
          stackId: id,
          produtoId: p.productId,
          ordem: p.ordem,
          criadoEm: new Date(),
        }));
        await db.insert(stackProdutos).values(stackProdutosToInsert);
      }
    }

    return stackAtualizada;
  }

  async deleteStack(id: string): Promise<void> {
    await db.delete(stacks).where(eq(stacks.id, id));
  }

  async toggleStackStatus(id: string): Promise<Stack> {
    const [stack] = await db.select().from(stacks).where(eq(stacks.id, id));
    if (!stack) {
      throw new Error("Stack não encontrada");
    }
    const [stackAtualizada] = await db
      .update(stacks)
      .set({
        ativo: !stack.ativo,
        atualizadoEm: new Date()
      })
      .where(eq(stacks.id, id))
      .returning();
    return stackAtualizada;
  }

  async reorderStacks(stacksToReorder: { id: string; ordem: number }[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (const { id, ordem } of stacksToReorder) {
        await tx.update(stacks).set({ ordem, atualizadoEm: new Date() }).where(eq(stacks.id, id));
      }
    });
  }

  async addProdutoToStack(stackProduto: InsertStackProduto): Promise<StackProduto> {
    const [novoStackProduto] = await db
      .insert(stackProdutos)
      .values(stackProduto)
      .returning();
    return novoStackProduto;
  }

  async removeProdutoFromStack(stackId: string, produtoId: string): Promise<void> {
    await db.delete(stackProdutos).where(
      and(
        eq(stackProdutos.stackId, stackId),
        eq(stackProdutos.produtoId, produtoId)
      )
    );
  }

  async updateStackProdutoOrdem(id: string, ordem: number): Promise<StackProduto> {
    const [stackProdutoAtualizado] = await db
      .update(stackProdutos)
      .set({ ordem })
      .where(eq(stackProdutos.id, id))
      .returning();
    return stackProdutoAtualizado;
  }

  async getCategorias(includeInactive: boolean = false): Promise<Categoria[]> {
    const query = db.select().from(categorias);
    if (!includeInactive) {
      query.where(eq(categorias.ativo, true));
    }
    return await query.orderBy(asc(categorias.titulo));
  }

  async getCategoriaById(id: string): Promise<Categoria | undefined> {
    const [categoria] = await db.select().from(categorias).where(eq(categorias.id, id));
    return categoria;
  }

  async createCategoria(categoria: InsertCategoria): Promise<Categoria> {
    const [novaCategoria] = await db
      .insert(categorias)
      .values({
        ...categoria,
        atualizadoEm: new Date()
      })
      .returning();
    return novaCategoria;
  }

  async updateCategoria(id: string, categoria: Partial<InsertCategoria>): Promise<Categoria> {
    const [categoriaAtualizada] = await db
      .update(categorias)
      .set({
        ...categoria,
        atualizadoEm: new Date()
      })
      .where(eq(categorias.id, id))
      .returning();
    return categoriaAtualizada;
  }

  async toggleCategoriaStatus(id: string): Promise<Categoria> {
    const [categoria] = await db.select().from(categorias).where(eq(categorias.id, id));
    if (!categoria) {
      throw new Error("Categoria não encontrada");
    }
    const [categoriaAtualizada] = await db
      .update(categorias)
      .set({
        ativo: !categoria.ativo,
        atualizadoEm: new Date()
      })
      .where(eq(categorias.id, id))
      .returning();
    return categoriaAtualizada;
  }

  async deleteCategoria(id: string): Promise<void> {
    await db.delete(categorias).where(eq(categorias.id, id));
  }

  async addCategoriaToProduto(categoriaProduto: InsertCategoriaProduto): Promise<CategoriaProduto> {
    const [novaCategoriaProduto] = await db
      .insert(categoriaProdutos)
      .values(categoriaProduto)
      .returning();
    return novaCategoriaProduto;
  }

  async removeCategoriaFromProduto(categoriaId: string, produtoId: string): Promise<void> {
    await db.delete(categoriaProdutos).where(
      and(
        eq(categoriaProdutos.categoriaId, categoriaId),
        eq(categoriaProdutos.produtoId, produtoId)
      )
    );
  }

  async updateProdutoCategorias(produtoId: string, categoriaIds: string[]): Promise<void> {
    await db.delete(categoriaProdutos).where(eq(categoriaProdutos.produtoId, produtoId));
    if (categoriaIds.length > 0) {
      const categoriaProdutosToInsert = categoriaIds.map(categoriaId => ({
        produtoId,
        categoriaId,
        criadoEm: new Date(),
      }));
      await db.insert(categoriaProdutos).values(categoriaProdutosToInsert);
    }
  }

  async getConfiguracao(chave: string): Promise<string | undefined> {
    const [config] = await db.select().from(configuracaoSite).where(eq(configuracaoSite.chave, chave));
    return config?.valor;
  }

  async setConfiguracao(config: InsertConfiguracaoSite): Promise<void> {
    await db
      .insert(configuracaoSite)
      .values({
        ...config,
        atualizadoEm: new Date()
      })
      .onConflictDoUpdate({
        target: configuracaoSite.chave,
        set: {
          valor: config.valor,
          descricao: config.descricao,
          atualizadoEm: new Date()
        }
      });
  }

  async createSessaoAdmin(sessao: InsertSessaoAdmin): Promise<string> {
    const [novaSessao] = await db
      .insert(sessaoAdmin)
      .values(sessao)
      .returning();
    return novaSessao.token;
  }

  async validateSessaoAdmin(token: string): Promise<boolean> {
    const [sessao] = await db
      .select()
      .from(sessaoAdmin)
      .where(
        and(
          eq(sessaoAdmin.token, token),
          eq(sessaoAdmin.ativo, true)
        )
      );

    if (!sessao) return false;

    if (new Date() > sessao.expiraEm) {
      await this.deleteSessaoAdmin(token);
      return false;
    }

    return true;
  }

  async deleteSessaoAdmin(token: string): Promise<void> {
    await db.update(sessaoAdmin).set({ ativo: false }).where(eq(sessaoAdmin.token, token));
  }
}

export const storage = new DatabaseStorage();