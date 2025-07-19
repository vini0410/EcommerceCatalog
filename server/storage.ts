import { Produto, Stack, StackProduto, ConfiguracaoSite, SessaoAdmin, type TProduto, type TStack, type TStackProduto, type InsertProduto, type InsertStack, type InsertStackProduto, type InsertConfiguracaoSite, type InsertSessaoAdmin } from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, ilike, or } from "drizzle-orm";

export interface IStorage {
  // Produtos
  getProdutos(search?: string, page?: number, limit?: number): Promise<{ produtos: TProduto[], total: number }>;
  getProdutoById(id: string): Promise<TProduto | undefined>;
  createProduto(produto: InsertProduto): Promise<TProduto>;
  updateProduto(id: string, produto: Partial<InsertProduto>): Promise<TProduto>;
  deleteProduto(id: string): Promise<void>;

  // Stacks
  getStacks(): Promise<(TStack & { produtos: (TStackProduto & { produto: TProduto })[] })[]>;
  getStackById(id: string): Promise<TStack | undefined>;
  createStack(stack: InsertStack): Promise<TStack>;
  updateStack(id: string, stack: Partial<InsertStack>): Promise<TStack>;
  deleteStack(id: string): Promise<void>;

  // Stack Produtos
  addProdutoToStack(stackProduto: InsertStackProduto): Promise<TStackProduto>;
  removeProdutoFromStack(stackId: string, produtoId: string): Promise<void>;
  updateStackProdutoOrdem(id: string, ordem: number): Promise<TStackProduto>;

  // Configuração
  getConfiguracao(chave: string): Promise<string | undefined>;
  setConfiguracao(config: InsertConfiguracaoSite): Promise<void>;

  // Admin
  createSessaoAdmin(sessao: InsertSessaoAdmin): Promise<string>;
  validateSessaoAdmin(token: string): Promise<boolean>;
  deleteSessaoAdmin(token: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getProdutos(search?: string, page: number = 1, limit: number = 20): Promise<{ produtos: TProduto[], total: number }> {
    const offset = (page - 1) * limit;
    
    const baseCondition = eq(Produto.ativo, true);
    
    const whereCondition = search ? 
      and(
        baseCondition,
        or(
          ilike(Produto.titulo, `%${search}%`),
          ilike(Produto.id, `%${search}%`)
        )
      ) : baseCondition;

    const [produtosList, totalResult] = await Promise.all([
      db.select().from(Produto)
        .where(whereCondition)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(Produto.criadoEm)),
      db.select({ count: Produto.id }).from(Produto).where(whereCondition)
    ]);

    return {
      produtos: produtosList,
      total: totalResult.length || 0
    };
  }

  async getProdutoById(id: string): Promise<TProduto | undefined> {
    const [produto] = await db.select().from(Produto).where(eq(Produto.id, id));
    return produto;
  }

  async createProduto(produto: InsertProduto): Promise<TProduto> {
    const descontoCalculado = produto.valorDesconto && produto.valorBruto 
      ? Math.round(((produto.valorBruto - produto.valorDesconto) / produto.valorBruto) * 100)
      : 0;

    const [novoProduto] = await db
      .insert(Produto)
      .values({
        ...produto,
        descontoCalculado,
        atualizadoEm: new Date()
      })
      .returning();
    return novoProduto;
  }

  async updateProduto(id: string, produto: Partial<InsertProduto>): Promise<TProduto> {
    const descontoCalculado = produto.valorDesconto && produto.valorBruto 
      ? Math.round(((produto.valorBruto - produto.valorDesconto) / produto.valorBruto) * 100)
      : undefined;

    const [produtoAtualizado] = await db
      .update(Produto)
      .set({
        ...produto,
        ...(descontoCalculado !== undefined && { descontoCalculado }),
        atualizadoEm: new Date()
      })
      .where(eq(Produto.id, id))
      .returning();
    return produtoAtualizado;
  }

  async deleteProduto(id: string): Promise<void> {
    await db.update(Produto).set({ ativo: false }).where(eq(Produto.id, id));
  }

  async getStacks(): Promise<(TStack & { produtos: (TStackProduto & { produto: TProduto })[] })[]> {
    const stacksList = await db.select().from(Stack).where(eq(Stack.ativo, true)).orderBy(asc(Stack.ordem));
    
    const stacksWithProdutos = await Promise.all(
      stacksList.map(async (stack) => {
        const stackProdutosList = await db
          .select()
          .from(StackProduto)
          .innerJoin(Produto, eq(StackProduto.produtoId, Produto.id))
          .where(and(
            eq(StackProduto.stackId, stack.id),
            eq(Produto.ativo, true)
          ))
          .orderBy(asc(StackProduto.ordem));

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

  async getStackById(id: string): Promise<TStack | undefined> {
    const [stack] = await db.select().from(Stack).where(eq(Stack.id, id));
    return stack;
  }

  async createStack(stack: InsertStack): Promise<TStack> {
    const [novaStack] = await db
      .insert(Stack)
      .values({
        ...stack,
        atualizadoEm: new Date()
      })
      .returning();
    return novaStack;
  }

  async updateStack(id: string, stack: Partial<InsertStack>): Promise<TStack> {
    const [stackAtualizada] = await db
      .update(Stack)
      .set({
        ...stack,
        atualizadoEm: new Date()
      })
      .where(eq(Stack.id, id))
      .returning();
    return stackAtualizada;
  }

  async deleteStack(id: string): Promise<void> {
    await db.update(Stack).set({ ativo: false }).where(eq(Stack.id, id));
  }

  async addProdutoToStack(stackProduto: InsertStackProduto): Promise<TStackProduto> {
    const [novoStackProduto] = await db
      .insert(StackProduto)
      .values(stackProduto)
      .returning();
    return novoStackProduto;
  }

  async removeProdutoFromStack(stackId: string, produtoId: string): Promise<void> {
    await db.delete(StackProduto).where(
      and(
        eq(StackProduto.stackId, stackId),
        eq(StackProduto.produtoId, produtoId)
      )
    );
  }

  async updateStackProdutoOrdem(id: string, ordem: number): Promise<TStackProduto> {
    const [stackProdutoAtualizado] = await db
      .update(StackProduto)
      .set({ ordem })
      .where(eq(StackProduto.id, id))
      .returning();
    return stackProdutoAtualizado;
  }

  async getConfiguracao(chave: string): Promise<string | undefined> {
    const [config] = await db.select().from(ConfiguracaoSite).where(eq(ConfiguracaoSite.chave, chave));
    return config?.valor;
  }

  async setConfiguracao(config: InsertConfiguracaoSite): Promise<void> {
    await db
      .insert(ConfiguracaoSite)
      .values({
        ...config,
        atualizadoEm: new Date()
      })
      .onConflictDoUpdate({
        target: ConfiguracaoSite.chave,
        set: {
          valor: config.valor,
          descricao: config.descricao,
          atualizadoEm: new Date()
        }
      });
  }

  async createSessaoAdmin(sessao: InsertSessaoAdmin): Promise<string> {
    const [novaSessao] = await db
      .insert(SessaoAdmin)
      .values(sessao)
      .returning();
    return novaSessao.token;
  }

  async validateSessaoAdmin(token: string): Promise<boolean> {
    const [sessao] = await db
      .select()
      .from(SessaoAdmin)
      .where(
        and(
          eq(SessaoAdmin.token, token),
          eq(SessaoAdmin.ativo, true)
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
    await db.update(SessaoAdmin).set({ ativo: false }).where(eq(SessaoAdmin.token, token));
  }
}

export const storage = new DatabaseStorage();
