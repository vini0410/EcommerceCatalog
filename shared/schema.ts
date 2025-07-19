import { pgTable, text, real, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const Produto = pgTable("produtos", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  titulo: text("titulo").notNull(),
  valorBruto: real("valorBruto").notNull(),
  valorDesconto: real("valorDesconto"),
  descontoCalculado: real("descontoCalculado"),
  fotos: text("fotos").array().notNull(),
  ativo: boolean("ativo").notNull().default(true),
  criadoEm: timestamp("criadoEm").notNull().defaultNow(),
  atualizadoEm: timestamp("atualizadoEm").notNull(),
});

export const Stack = pgTable("stacks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  titulo: text("titulo").notNull(),
  ordem: integer("ordem").notNull().default(0),
  ativo: boolean("ativo").notNull().default(true),
  criadoEm: timestamp("criadoEm").notNull().defaultNow(),
  atualizadoEm: timestamp("atualizadoEm").notNull(),
});

export const StackProduto = pgTable("stack_produtos", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  stackId: text("stackId").notNull().references(() => Stack.id, { onDelete: "cascade" }),
  produtoId: text("produtoId").notNull().references(() => Produto.id, { onDelete: "cascade" }),
  ordem: integer("ordem").notNull().default(0),
  criadoEm: timestamp("criadoEm").notNull().defaultNow(),
});

export const ConfiguracaoSite = pgTable("configuracao_site", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  chave: text("chave").notNull().unique(),
  valor: text("valor").notNull(),
  descricao: text("descricao"),
  criadoEm: timestamp("criadoEm").notNull().defaultNow(),
  atualizadoEm: timestamp("atualizadoEm").notNull(),
});

export const SessaoAdmin = pgTable("sessao_admin", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  token: text("token").notNull().unique(),
  ativo: boolean("ativo").notNull().default(true),
  expiraEm: timestamp("expiraEm").notNull(),
  criadoEm: timestamp("criadoEm").notNull().defaultNow(),
});

// Relations
export const produtosRelations = relations(Produto, ({ many }) => ({
  stackProdutos: many(StackProduto),
}));

export const stacksRelations = relations(Stack, ({ many }) => ({
  produtos: many(StackProduto),
}));

export const stackProdutosRelations = relations(StackProduto, ({ one }) => ({
  stack: one(Stack, {
    fields: [StackProduto.stackId],
    references: [Stack.id],
  }),
  produto: one(Produto, {
    fields: [StackProduto.produtoId],
    references: [Produto.id],
  }),
}));

// Insert schemas
export const insertProdutoSchema = createInsertSchema(Produto).omit({
  id: true,
  criadoEm: true,
  atualizadoEm: true,
});

export const insertStackSchema = createInsertSchema(Stack).omit({
  id: true,
  criadoEm: true,
  atualizadoEm: true,
});

export const insertStackProdutoSchema = createInsertSchema(StackProduto).omit({
  id: true,
  criadoEm: true,
});

export const insertConfiguracaoSiteSchema = createInsertSchema(ConfiguracaoSite).omit({
  id: true,
  criadoEm: true,
  atualizadoEm: true,
});

export const insertSessaoAdminSchema = createInsertSchema(SessaoAdmin).omit({
  id: true,
  criadoEm: true,
});

// Types
export type TProduto = typeof Produto.$inferSelect;
export type InsertProduto = z.infer<typeof insertProdutoSchema>;
export type TStack = typeof Stack.$inferSelect;
export type InsertStack = z.infer<typeof insertStackSchema>;
export type TStackProduto = typeof StackProduto.$inferSelect;
export type InsertStackProduto = z.infer<typeof insertStackProdutoSchema>;
export type TConfiguracaoSite = typeof ConfiguracaoSite.$inferSelect;
export type InsertConfiguracaoSite = z.infer<typeof insertConfiguracaoSiteSchema>;
export type TSessaoAdmin = typeof SessaoAdmin.$inferSelect;
export type InsertSessaoAdmin = z.infer<typeof insertSessaoAdminSchema>;
