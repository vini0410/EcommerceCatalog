import { pgTable, text, serial, integer, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const produtos = pgTable("produtos", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  titulo: text("titulo").notNull(),
  valorBruto: real("valorBruto").notNull(),
  valorDesconto: real("valorDesconto"),
  descontoCalculado: real("descontoCalculado"),
  descricao: text("descricao"),
  fotos: text("fotos").array().notNull().default([]),
  ativo: boolean("ativo").notNull().default(true),
  criadoEm: timestamp("criadoEm").notNull().defaultNow(),
  atualizadoEm: timestamp("atualizadoEm").notNull().defaultNow(),
});

export const stacks = pgTable("stacks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  titulo: text("titulo").notNull(),
  ordem: integer("ordem").notNull().default(0),
  ativo: boolean("ativo").notNull().default(true),
  criadoEm: timestamp("criadoEm").notNull().defaultNow(),
  atualizadoEm: timestamp("atualizadoEm").notNull().defaultNow(),
});

export const stackProdutos = pgTable("stack_produtos", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  stackId: text("stackId").notNull().references(() => stacks.id, { onDelete: "cascade" }),
  produtoId: text("produtoId").notNull().references(() => produtos.id, { onDelete: "cascade" }),
  ordem: integer("ordem").notNull().default(0),
  criadoEm: timestamp("criadoEm").notNull().defaultNow(),
});

export const configuracaoSite = pgTable("configuracao_site", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  chave: text("chave").notNull().unique(),
  valor: text("valor").notNull(),
  descricao: text("descricao"),
  criadoEm: timestamp("criadoEm").notNull().defaultNow(),
  atualizadoEm: timestamp("atualizadoEm").notNull().defaultNow(),
});

export const sessaoAdmin = pgTable("sessao_admin", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  token: text("token").notNull().unique(),
  ativo: boolean("ativo").notNull().default(true),
  expiraEm: timestamp("expiraEm").notNull(),
  criadoEm: timestamp("criadoEm").notNull().defaultNow(),
});

// Relations
export const produtosRelations = relations(produtos, ({ many }) => ({
  stackProdutos: many(stackProdutos),
}));

export const stacksRelations = relations(stacks, ({ many }) => ({
  produtos: many(stackProdutos),
}));

export const stackProdutosRelations = relations(stackProdutos, ({ one }) => ({
  stack: one(stacks, {
    fields: [stackProdutos.stackId],
    references: [stacks.id],
  }),
  produto: one(produtos, {
    fields: [stackProdutos.produtoId],
    references: [produtos.id],
  }),
}));

// Insert schemas
export const insertProdutoSchema = createInsertSchema(produtos).omit({
  id: true,
  criadoEm: true,
  atualizadoEm: true,
});

export const insertStackSchema = createInsertSchema(stacks).omit({
  id: true,
  criadoEm: true,
  atualizadoEm: true,
}).extend({
  produtos: z.array(z.object({
    productId: z.string(),
    ordem: z.number(),
  })).optional(),
});

export const insertStackProdutoSchema = createInsertSchema(stackProdutos).omit({
  id: true,
  criadoEm: true,
});

export const insertConfiguracaoSiteSchema = createInsertSchema(configuracaoSite).omit({
  id: true,
  criadoEm: true,
  atualizadoEm: true,
});

export const insertSessaoAdminSchema = createInsertSchema(sessaoAdmin).omit({
  id: true,
  criadoEm: true,
});

// Types
export type Produto = typeof produtos.$inferSelect;
export type InsertProduto = z.infer<typeof insertProdutoSchema>;
export type Stack = typeof stacks.$inferSelect;
export type InsertStack = z.infer<typeof insertStackSchema>;
export type StackProduto = typeof stackProdutos.$inferSelect;
export type InsertStackProduto = z.infer<typeof insertStackProdutoSchema>;
export type ConfiguracaoSite = typeof configuracaoSite.$inferSelect;
export type InsertConfiguracaoSite = z.infer<typeof insertConfiguracaoSiteSchema>;
export type SessaoAdmin = typeof sessaoAdmin.$inferSelect;
export type InsertSessaoAdmin = z.infer<typeof insertSessaoAdminSchema>;

export const reorderStacksSchema = z.object({
  stacks: z.array(z.object({
    id: z.string(),
    ordem: z.number(),
  })),
});

export type ReorderStack = z.infer<typeof reorderStacksSchema>;
