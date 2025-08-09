import { produtos, stacks, stackProdutos, configuracaoSite, sessaoAdmin, type Produto, type Stack, type StackProduto, type InsertProduto, type InsertStack, type InsertStackProduto, type InsertConfiguracaoSite, type InsertSessaoAdmin } from "../shared/schema.js";
import { db } from "./db.js";
import { eq, desc, asc, and, ilike, or, max, count } from "drizzle-orm";
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
  getProdutos(search?: string, page?: number, limit?: number, stackId?: string, includeInactive?: boolean): Promise<{ produtos: Produto[], total: number }>;
  getProdutoById(id: string): Promise<Produto | undefined>;
  createProduto(produto: InsertProduto): Promise<Produto>;
  updateProduto(id: string, produto: Partial<InsertProduto>): Promise<Produto>;
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

  // Configuração
  getConfiguracao(chave: string): Promise<string | undefined>;
  setConfiguracao(config: InsertConfiguracaoSite): Promise<void>;

  // Admin
  createSessaoAdmin(sessao: InsertSessaoAdmin): Promise<string>;
  validateSessaoAdmin(token: string): Promise<boolean>;
  deleteSessaoAdmin(token: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getProdutos(search?: string, page: number = 1, limit: number = 20, stackId?: string, includeInactive: boolean = false): Promise<{ produtos: Produto[], total: number }> {
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

    let produtosList: Produto[] = [];
    let total = 0;

    if (stackId) {
      const stackConditions = [...baseConditions, eq(stackProdutos.stackId, stackId)];
      const whereClause = and(...stackConditions);

      const [joinedProdutosList, countResult] = await Promise.all([
        db.select({
            id: produtos.id,
            titulo: produtos.titulo,
            valorBruto: produtos.valorBruto,
            valorDesconto: produtos.valorDesconto,
            descontoCalculado: produtos.descontoCalculado,
            descricao: produtos.descricao,
            fotos: produtos.fotos,
            ativo: produtos.ativo,
            criadoEm: produtos.criadoEm,
            atualizadoEm: produtos.atualizadoEm,
          })
          .from(produtos)
          .innerJoin(stackProdutos, eq(produtos.id, stackProdutos.produtoId))
          .where(whereClause)
          .limit(limit)
          .offset(offset)
          .orderBy(asc(produtos.titulo)),
        db.select({ value: count() })
          .from(produtos)
          .innerJoin(stackProdutos, eq(produtos.id, stackProdutos.produtoId))
          .where(whereClause)
      ]);
      produtosList = joinedProdutosList;
      total = countResult[0]?.value || 0;

    } else {
      const whereClause = baseConditions.length > 0 ? and(...baseConditions) : undefined;

      const [directProdutosList, countResult] = await Promise.all([
        db.select()
          .from(produtos)
          .where(whereClause)
          .limit(limit)
          .offset(offset)
          .orderBy(asc(produtos.titulo)),
        db.select({ value: count() })
          .from(produtos)
          .where(whereClause)
      ]);
      produtosList = directProdutosList;
      total = countResult[0]?.value || 0;
    }

    return {
      produtos: produtosList,
      total: total
    };
  }

  async getProdutoById(id: string): Promise<Produto | undefined> {
    const [produto] = await db.select().from(produtos).where(eq(produtos.id, id));
    return produto;
  }

  async createProduto(produto: InsertProduto): Promise<Produto> {
    const descontoCalculado = produto.valorDesconto && produto.valorBruto 
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
    return novoProduto;
  }

  async updateProduto(id: string, produto: Partial<InsertProduto>): Promise<Produto> {
    const descontoCalculado = produto.valorDesconto && produto.valorBruto 
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
    // 1. Obter o produto para pegar as URLs das fotos
    const produtoToDelete = await this.getProdutoById(id);
    if (!produtoToDelete) {
      throw new Error("Produto não encontrado");
    }

    // 2. Extrair os caminhos dos arquivos das URLs e deletar do Supabase Storage
    if (produtoToDelete.fotos && produtoToDelete.fotos.length > 0) {
      console.log("Produto a ser deletado possui fotos:", produtoToDelete.fotos);
      const filePaths = produtoToDelete.fotos.map(url => {
        // Extrai o caminho do arquivo da URL pública do Supabase
        // Ex: https://<project_id>.supabase.co/storage/v1/object/public/imagens-produtos/caminho/do/arquivo.jpg
        // Queremos: imagens-produtos/caminho/do/arquivo.jpg
        const parts = url.split('/');
        const bucketName = 'imagens-produtos'; // Nome do seu bucket
        const bucketNameIndex = parts.indexOf(bucketName);
        if (bucketNameIndex === -1) {
          console.error("Nome do bucket não encontrado na URL da imagem:", url);
          return ''; // Retorna vazio ou lança um erro, dependendo da sua estratégia
        }
        return parts.slice(bucketNameIndex + 1).join('/');
      });
      console.log("Caminhos dos arquivos para deletar:", filePaths);

      const { error: deleteError } = await supabaseAdmin.storage
        .from('imagens-produtos') // Nome do seu bucket
        .remove(filePaths);

      if (deleteError) {
        console.error("Erro ao deletar imagens do Supabase Storage:", deleteError);
        // Decida se você quer lançar um erro aqui ou apenas logar
        // Por enquanto, vamos apenas logar e continuar com a exclusão do DB
      } else {
        console.log("Imagens deletadas do Supabase Storage com sucesso.");
      }
    } else {
      console.log("Produto a ser deletado não possui fotos ou o array de fotos está vazio.");
    }

    // 3. Deletar o produto do banco de dados
    await db.delete(produtos).where(eq(produtos.id, id));
  }

  async getStacks(includeInactive: boolean = false): Promise<(Stack & { produtos: (StackProduto & { produto: Produto })[] })[]> {
    console.log(`getStacks called with includeInactive: ${includeInactive}`);

    let stacksList: Stack[] = [];
    try {
      const query = db.select().from(stacks);
      if (!includeInactive) {
        query.where(eq(stacks.ativo, true));
      }
      stacksList = await query.orderBy(asc(stacks.ordem));
      console.log(`Stacks retrieved: ${stacksList.length} stacks`);
    } catch (error) {
      console.error("Error fetching initial stacks list:", error);
      throw error; // Re-throw to be caught by the route handler
    }

    let stacksWithProdutos = [];
    try {
      stacksWithProdutos = await Promise.all(
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
    } catch (error) {
      console.error("Error fetching products for stacks:", error);
      throw error; // Re-throw to be caught by the route handler
    }

    // Filter out stacks that have no active products for public view
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
      // Delete existing stack products for this stack
      await db.delete(stackProdutos).where(eq(stackProdutos.stackId, id));

      // Insert new stack products
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
    console.log(`Stack ${stack.id} - Ativo antes: ${stack.ativo}`);
    const [stackAtualizada] = await db
      .update(stacks)
      .set({
        ativo: !stack.ativo,
        atualizadoEm: new Date()
      })
      .where(eq(stacks.id, id))
      .returning();
    console.log(`Stack ${stackAtualizada.id} - Ativo depois: ${stackAtualizada.ativo}`);
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

    // Check if session is expired
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
