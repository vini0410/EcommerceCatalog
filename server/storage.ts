import { produtos, stacks, stackProdutos, configuracaoSite, sessaoAdmin, type Produto, type Stack, type StackProduto, type InsertProduto, type InsertStack, type InsertStackProduto, type InsertConfiguracaoSite, type InsertSessaoAdmin } from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, ilike, or } from "drizzle-orm";

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
    
    let query = db.select().from(produtos);
    let countQuery = db.select({ count: produtos.id }).from(produtos);

    let conditions = [];
    if (!includeInactive) {
      conditions.push(eq(produtos.ativo, true));
    }

    if (stackId) {
      query = query.innerJoin(stackProdutos, eq(produtos.id, stackProdutos.produtoId));
      countQuery = countQuery.innerJoin(stackProdutos, eq(produtos.id, stackProdutos.produtoId));
      conditions.push(eq(stackProdutos.stackId, stackId));
    }
    
    if (search) {
      conditions.push(or(
        ilike(produtos.titulo, `%${search}%`),
        ilike(produtos.id, `%${search}%`)
      ));
    }

    const [produtosList, totalResult] = await Promise.all([
      query.where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(produtos.criadoEm)),
      countQuery.where(conditions.length > 0 ? and(...conditions) : undefined)
    ]);

    return {
      produtos: produtosList.map(row => row.produtos || row), // Adjust for innerJoin result structure
      total: totalResult.length || 0
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
    await db.delete(produtos).where(eq(produtos.id, id));
  }

  async getStacks(includeInactive: boolean = false): Promise<(Stack & { produtos: (StackProduto & { produto: Produto })[] })[]> {
    console.log(`getStacks called with includeInactive: ${includeInactive}`);
    let query = db.select().from(stacks);
    if (!includeInactive) {
      query = query.where(eq(stacks.ativo, true));
    }
    const stacksList = await query.orderBy(asc(stacks.ordem));
    console.log(`Stacks retrieved: ${stacksList.length} stacks`);
    
    const stacksWithProdutos = await Promise.all(
      stacksList.map(async (stack) => {
        const stackProdutosList = await db
          .select()
          .from(stackProdutos)
          .innerJoin(produtos, eq(stackProdutos.produtoId, produtos.id))
          .where(
            eq(stackProdutos.stackId, stack.id)
          )
          .orderBy(asc(stackProdutos.ordem));

        return {
          ...stack,
          produtos: stackProdutosList.map(({ stack_produtos, produtos: produto }) => ({
            ...stack_produtos,
            produto
          }))
        };
      })
    );

    return stacksWithProdutos;
  }

  async getStackById(id: string): Promise<Stack | undefined> {
    const [stack] = await db.select().from(stacks).where(eq(stacks.id, id));
    return stack;
  }

  async createStack(stack: InsertStack, produtosData?: { productId: string, ordem: number }[]): Promise<Stack> {
    const [novaStack] = await db
      .insert(stacks)
      .values({
        ...stack,
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
