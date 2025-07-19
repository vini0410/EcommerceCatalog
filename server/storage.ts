import { produtos, stacks, stackProdutos, configuracaoSite, sessaoAdmin, type Produto, type Stack, type StackProduto, type InsertProduto, type InsertStack, type InsertStackProduto, type InsertConfiguracaoSite, type InsertSessaoAdmin } from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, ilike, or } from "drizzle-orm";

export interface IStorage {
  // Produtos
  getProdutos(search?: string, page?: number, limit?: number): Promise<{ produtos: Produto[], total: number }>;
  getProdutoById(id: string): Promise<Produto | undefined>;
  createProduto(produto: InsertProduto): Promise<Produto>;
  updateProduto(id: string, produto: Partial<InsertProduto>): Promise<Produto>;
  deleteProduto(id: string): Promise<void>;

  // Stacks
  getStacks(): Promise<(Stack & { produtos: (StackProduto & { produto: Produto })[] })[]>;
  getStackById(id: string): Promise<Stack | undefined>;
  createStack(stack: InsertStack): Promise<Stack>;
  updateStack(id: string, stack: Partial<InsertStack>): Promise<Stack>;
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
  async getProdutos(search?: string, page: number = 1, limit: number = 20): Promise<{ produtos: Produto[], total: number }> {
    const offset = (page - 1) * limit;
    
    const baseCondition = eq(produtos.ativo, true);
    
    const whereCondition = search ? 
      and(
        baseCondition,
        or(
          ilike(produtos.titulo, `%${search}%`),
          ilike(produtos.id, `%${search}%`)
        )
      ) : baseCondition;

    const [produtosList, totalResult] = await Promise.all([
      db.select().from(produtos)
        .where(whereCondition)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(produtos.criadoEm)),
      db.select({ count: produtos.id }).from(produtos).where(whereCondition)
    ]);

    return {
      produtos: produtosList,
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

  async deleteProduto(id: string): Promise<void> {
    await db.update(produtos).set({ ativo: false }).where(eq(produtos.id, id));
  }

  async getStacks(): Promise<(Stack & { produtos: (StackProduto & { produto: Produto })[] })[]> {
    const stacksList = await db.select().from(stacks).where(eq(stacks.ativo, true)).orderBy(asc(stacks.ordem));
    
    const stacksWithProdutos = await Promise.all(
      stacksList.map(async (stack) => {
        const stackProdutosList = await db
          .select()
          .from(stackProdutos)
          .innerJoin(produtos, eq(stackProdutos.produtoId, produtos.id))
          .where(and(
            eq(stackProdutos.stackId, stack.id),
            eq(produtos.ativo, true)
          ))
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

  async createStack(stack: InsertStack): Promise<Stack> {
    const [novaStack] = await db
      .insert(stacks)
      .values({
        ...stack,
        atualizadoEm: new Date()
      })
      .returning();
    return novaStack;
  }

  async updateStack(id: string, stack: Partial<InsertStack>): Promise<Stack> {
    const [stackAtualizada] = await db
      .update(stacks)
      .set({
        ...stack,
        atualizadoEm: new Date()
      })
      .where(eq(stacks.id, id))
      .returning();
    return stackAtualizada;
  }

  async deleteStack(id: string): Promise<void> {
    await db.update(stacks).set({ ativo: false }).where(eq(stacks.id, id));
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
