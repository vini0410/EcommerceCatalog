import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { insertProdutoSchema, insertStackSchema, insertStackProdutoSchema, reorderStacksSchema } from "../shared/schema.js";
import passport from "passport";

export async function registerRoutes(app: Express): Promise<Server> {
  console.log("registerRoutes function called.");
  // Middleware para validação de admin
  const requireAdmin = (req: any, res: any, next: any) => {
    console.log("isAuthenticated:", req.isAuthenticated());
    if (req.isAuthenticated()) {
      console.log("isAuthenticated: true, calling next()");
      return next();
    }
    res.status(401).json({ message: 'Acesso não autorizado' });
  };

  // Produtos públicos
  app.get("/api/produtos", async (req, res) => {
    try {
      const { search, page = 1, limit = 20, stackId, includeInactive } = req.query;
      const resultado = await storage.getProdutos(
        search as string,
        parseInt(page as string),
        parseInt(limit as string),
        stackId as string,
        includeInactive === 'true' // Convert string to boolean
      );
      res.json(resultado);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar produtos" });
    }
  });

  app.get("/api/produtos/:id", async (req, res) => {
    try {
      const produto = await storage.getProdutoById(req.params.id);
      if (!produto) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }
      res.json(produto);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar produto" });
    }
  });

  // Stacks públicas
  app.get("/api/stacks", async (req, res) => {
    try {
      const { includeInactive } = req.query;
      const stacks = await storage.getStacks(includeInactive === 'true');
      res.json(stacks);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar stacks" });
    }
  });

  // Login admin
  app.post("/api/admin/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info ? info.message : "Credenciais inválidas" });
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({ message: "Login successful", user: req.user });
      });
    })(req, res, next);
  });

  app.post("/api/admin/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/admin/check", (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ isAuthenticated: true, user: req.user });
    } else {
      res.json({ isAuthenticated: false });
    }
  });

  // CRUD Produtos (Admin)
  app.post("/api/admin/produtos", requireAdmin, async (req, res) => {
    try {
      const produtoData = insertProdutoSchema.parse(req.body);
      const produto = await storage.createProduto(produtoData);
      res.status(201).json(produto);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao criar produto" });
    }
  });

  app.put("/api/admin/produtos/:id", requireAdmin, async (req, res) => {
    try {
      const produtoData = insertProdutoSchema.partial().parse(req.body);
      const produto = await storage.updateProduto(req.params.id, produtoData);
      res.json(produto);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao atualizar produto" });
    }
  });

  app.put("/api/admin/produtos/:id/toggle-status", requireAdmin, async (req, res) => {
    try {
      const produto = await storage.toggleProdutoStatus(req.params.id);
      res.json(produto);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao alternar status do produto" });
    }
  });

  app.delete("/api/admin/produtos/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteProduto(req.params.id);
      res.json({ message: "Produto removido com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao remover produto" });
    }
  });

  // CRUD Stacks (Admin)
  app.post("/api/admin/stacks", requireAdmin, async (req, res) => {
    try {
      const { produtos, ...stackData } = insertStackSchema.parse(req.body);
      const stack = await storage.createStack(stackData, produtos);
      res.status(201).json(stack);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao criar stack" });
    }
  });

  app.put("/api/admin/stacks/:id", requireAdmin, async (req, res) => {
    try {
      const { produtos, ...stackData } = insertStackSchema.partial().parse(req.body);
      const stack = await storage.updateStack(req.params.id, stackData, produtos);
      res.json(stack);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao atualizar stack" });
    }
  });

  app.delete("/api/admin/stacks/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteStack(req.params.id);
      res.json({ message: "Stack removida com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao remover stack" });
    }
  });

  app.put("/api/admin/stacks/:id/toggle-status", requireAdmin, async (req, res) => {
    try {
      const stack = await storage.toggleStackStatus(req.params.id);
      res.json(stack);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao alternar status da stack" });
    }
  });

  // Gerenciar produtos em stacks
  app.post("/api/admin/stacks/:stackId/produtos", requireAdmin, async (req, res) => {
    try {
      const stackProdutoData = insertStackProdutoSchema.parse({
        ...req.body,
        stackId: req.params.stackId
      });
      const stackProduto = await storage.addProdutoToStack(stackProdutoData);
      res.status(201).json(stackProduto);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao adicionar produto à stack" });
    }
  });

  app.delete("/api/admin/stacks/:stackId/produtos/:produtoId", requireAdmin, async (req, res) => {
    try {
      await storage.removeProdutoFromStack(req.params.stackId, req.params.produtoId);
      res.json({ message: "Produto removido da stack com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao remover produto da stack" });
    }
  });

  app.put("/api/admin/stack-produtos/:id/ordem", requireAdmin, async (req, res) => {
    try {
      const { ordem } = req.body;
      const stackProduto = await storage.updateStackProdutoOrdem(req.params.id, ordem);
      res.json(stackProduto);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar ordem do produto" });
    }
  });

  app.patch("/api/admin/stacks/reorder", requireAdmin, async (req, res) => {
    console.log("Reordering stacks");
    console.log("Request body for reorderStacks:", req.body);
    try {
      const reorderedStacks = reorderStacksSchema.parse(req.body);
      await storage.reorderStacks(reorderedStacks);
      console.log("Sending success response for reorderStacks:", { message: "Ordem das stacks atualizada com sucesso" });
      res.json({ message: "Ordem das stacks atualizada com sucesso" });
    } catch (error: any) {
      console.error("Error reordering stacks:", error);
      res.status(400).json({ message: error.message || "Erro ao reordenar stacks" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
