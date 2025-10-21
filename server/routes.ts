import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { insertProdutoSchema, insertStackSchema, insertStackProdutoSchema, reorderStacksSchema, insertCategoriaSchema } from "../shared/schema.js";
import passport from "passport";
import { getMaintenanceMode, setMaintenanceMode } from "./settings.js";

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware para validação de admin
  const requireAdmin = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: 'Acesso não autorizado' });
  };

  // Rota de Login
  app.post("/api/admin/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        console.error("Erro durante o login do admin:", err);
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info ? info.message : "Credenciais inválidas" });
      }
      req.logIn(user, (err) => {
        if (err) {
          console.error("Erro ao estabelecer sessão de login:", err);
          return next(err);
        }
        return res.json({ message: "Login successful", user: req.user });
      });
    })(req, res, next);
  });

  // Rota de Logout
  app.post("/api/admin/logout", requireAdmin, (req, res, next) => {
    req.logout((err) => {
      if (err) {
        console.error("Erro durante o logout do admin:", err);
        return next(err);
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Rota de verificação de sessão
  app.get("/api/admin/check", (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ isAuthenticated: true, user: req.user });
    } else {
      res.json({ isAuthenticated: false });
    }
  });

  // --- Rotas Públicas ---
  app.get("/api/settings/maintenance", async (req, res) => {
    try {
      const maintenanceMode = await getMaintenanceMode();
      res.json({ maintenanceMode });
    } catch (error: any) {
      console.error("Erro ao buscar status do modo de manutenção:", error);
      res.status(500).json({ message: `Erro ao buscar status do modo de manutenção: ${error.message}` });
    }
  });

  app.get("/api/produtos", async (req, res) => {
    try {
      const { q, page = 1, limit = 20, stackId, categoryIds, includeInactive } = req.query;
      const resultado = await storage.getProdutos(
        q as string,
        parseInt(page as string),
        parseInt(limit as string),
        stackId as string,
        categoryIds as string,
        includeInactive === 'true'
      );
      res.json(resultado);
    } catch (error: any) {
      console.error("Erro ao buscar produtos:", error);
      res.status(500).json({ message: `Erro ao buscar produtos: ${error.message}` });
    }
  });

  app.get("/api/produtos/:id", async (req, res) => {
    try {
      const produto = await storage.getProdutoById(req.params.id);
      if (!produto) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }
      res.json(produto);
    } catch (error: any) {
      console.error("Erro ao buscar produto por ID:", error);
      res.status(500).json({ message: `Erro ao buscar produto: ${error.message}` });
    }
  });

  // --- Rotas de Admin ---
  app.put("/api/admin/settings/maintenance", requireAdmin, async (req, res) => {
    try {
      const { mode } = req.body;
      if (typeof mode !== 'boolean') {
        return res.status(400).json({ message: "O parâmetro 'mode' deve ser um booleano." });
      }
      await setMaintenanceMode(mode);
      res.json({ message: "Modo de manutenção atualizado com sucesso", maintenanceMode: mode });
    } catch (error: any) {
      console.error("Erro ao atualizar modo de manutenção:", error);
      res.status(500).json({ message: `Erro ao atualizar modo de manutenção: ${error.message}` });
    }
  });

  app.post("/api/admin/produtos", requireAdmin, async (req, res) => {
    try {
      const { categoriaIds, ...produtoData } = insertProdutoSchema.parse(req.body);
      const produto = await storage.createProduto(produtoData, categoriaIds);
      res.status(201).json(produto);
    } catch (error: any) {
      console.error("Erro ao criar produto:", error);
      res.status(400).json({ message: error.message || `Erro ao criar produto: ${error.message}` });
    }
  });

  app.put("/api/admin/produtos/:id", requireAdmin, async (req, res) => {
    try {
      const { categoriaIds, ...produtoData } = insertProdutoSchema.partial().parse(req.body);
      const produto = await storage.updateProduto(req.params.id, produtoData, categoriaIds);
      res.json(produto);
    } catch (error: any) {
      console.error("Erro ao atualizar produto:", error);
      res.status(400).json({ message: error.message || `Erro ao atualizar produto: ${error.message}` });
    }
  });

  app.put("/api/admin/produtos/:id/toggle-status", requireAdmin, async (req, res) => {
    try {
      const produto = await storage.toggleProdutoStatus(req.params.id);
      res.json(produto);
    } catch (error: any) {
      console.error("Erro ao alternar status do produto:", error);
      res.status(400).json({ message: error.message || `Erro ao alternar status do produto: ${error.message}` });
    }
  });

  app.delete("/api/admin/produtos/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteProduto(req.params.id);
      res.json({ message: "Produto removido com sucesso" });
    } catch (error: any) {
      console.error("Erro ao remover produto:", error);
      res.status(500).json({ message: `Erro ao remover produto: ${error.message}` });
    }
  });

  // Stacks
  app.get("/api/stacks", async (req, res) => {
    try {
      const { includeInactive } = req.query;
      const stacks = await storage.getStacks(includeInactive === 'true');
      res.json(stacks);
    } catch (error: any) {
      console.error("Erro ao buscar stacks:", error);
      res.status(500).json({ message: `Erro ao buscar stacks: ${error.message}` });
    }
  });

  app.post("/api/admin/stacks", requireAdmin, async (req, res) => {
    try {
      const { produtos, ...stackData } = insertStackSchema.parse(req.body);
      const stack = await storage.createStack(stackData, produtos);
      res.status(201).json(stack);
    } catch (error: any) {
      console.error("Erro ao criar stack:", error);
      res.status(400).json({ message: error.message || `Erro ao criar stack: ${error.message}` });
    }
  });

  app.put("/api/admin/stacks/:id", requireAdmin, async (req, res) => {
    try {
      const { produtos, ...stackData } = insertStackSchema.partial().parse(req.body);
      const stack = await storage.updateStack(req.params.id, stackData, produtos);
      res.json(stack);
    } catch (error: any) {
      console.error("Erro ao atualizar stack:", error);
      res.status(400).json({ message: error.message || `Erro ao atualizar stack: ${error.message}` });
    }
  });

  app.delete("/api/admin/stacks/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteStack(req.params.id);
      res.json({ message: "Stack removida com sucesso" });
    } catch (error: any) {
      console.error("Erro ao remover stack:", error);
      res.status(500).json({ message: `Erro ao remover stack: ${error.message}` });
    }
  });

  app.put("/api/admin/stacks/:id/toggle-status", requireAdmin, async (req, res) => {
    try {
      const stack = await storage.toggleStackStatus(req.params.id);
      res.json(stack);
    } catch (error: any) {
      console.error("Erro ao alternar status da stack:", error);
      res.status(400).json({ message: error.message || `Erro ao alternar status da stack: ${error.message}` });
    }
  });

  app.patch("/api/admin/stacks/reorder", requireAdmin, async (req, res) => {
    try {
      const reorderedStacks = reorderStacksSchema.parse(req.body);
      await storage.reorderStacks(reorderedStacks);
      res.json({ message: "Ordem das stacks atualizada com sucesso" });
    } catch (error: any) {
      console.error("Erro ao reordenar stacks:", error);
      res.status(400).json({ message: error.message || `Erro ao reordenar stacks: ${error.message}` });
    }
  });

  // Stack Produtos
  app.post("/api/admin/stacks/:stackId/produtos", requireAdmin, async (req, res) => {
    try {
      const stackProdutoData = insertStackProdutoSchema.parse({
        ...req.body,
        stackId: req.params.stackId
      });
      const stackProduto = await storage.addProdutoToStack(stackProdutoData);
      res.status(201).json(stackProduto);
    } catch (error: any) {
      console.error("Erro ao adicionar produto à stack:", error);
      res.status(400).json({ message: error.message || `Erro ao adicionar produto à stack: ${error.message}` });
    }
  });

  app.delete("/api/admin/stacks/:stackId/produtos/:produtoId", requireAdmin, async (req, res) => {
    try {
      await storage.removeProdutoFromStack(req.params.stackId, req.params.produtoId);
      res.json({ message: "Produto removido da stack com sucesso" });
    } catch (error: any) {
      console.error("Erro ao remover produto da stack:", error);
      res.status(500).json({ message: `Erro ao remover produto da stack: ${error.message}` });
    }
  });

  app.put("/api/admin/stack-produtos/:id/ordem", requireAdmin, async (req, res) => {
    try {
      const { ordem } = req.body;
      const stackProduto = await storage.updateStackProdutoOrdem(req.params.id, ordem);
      res.json(stackProduto);
    } catch (error: any) {
      console.error("Erro ao atualizar ordem do produto na stack:", error);
      res.status(500).json({ message: `Erro ao atualizar ordem do produto: ${error.message}` });
    }
  });

  // Categorias
  app.get("/api/categorias", async (req, res) => {
    try {
      const { includeInactive } = req.query;
      const categorias = await storage.getCategorias(includeInactive === 'true');
      res.json(categorias);
    } catch (error: any) {
      console.error("Erro ao buscar categorias:", error);
      res.status(500).json({ message: `Erro ao buscar categorias: ${error.message}` });
    }
  });

  app.post("/api/admin/categorias", requireAdmin, async (req, res) => {
    try {
      const categoriaData = insertCategoriaSchema.parse(req.body);
      const categoria = await storage.createCategoria(categoriaData);
      res.status(201).json(categoria);
    } catch (error: any) {
      console.error("Erro ao criar categoria:", error);
      res.status(400).json({ message: error.message || `Erro ao criar categoria: ${error.message}` });
    }
  });

  app.put("/api/admin/categorias/:id", requireAdmin, async (req, res) => {
    try {
      const categoriaData = insertCategoriaSchema.partial().parse(req.body);
      const categoria = await storage.updateCategoria(req.params.id, categoriaData);
      res.json(categoria);
    } catch (error: any) {
      console.error("Erro ao atualizar categoria:", error);
      res.status(400).json({ message: error.message || `Erro ao atualizar categoria: ${error.message}` });
    }
  });

  app.put("/api/admin/categorias/:id/toggle-status", requireAdmin, async (req, res) => {
    try {
      const categoria = await storage.toggleCategoriaStatus(req.params.id);
      res.json(categoria);
    } catch (error: any) {
      console.error("Erro ao alternar status da categoria:", error);
      res.status(400).json({ message: error.message || `Erro ao alternar status da categoria: ${error.message}` });
    }
  });

  app.delete("/api/admin/categorias/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteCategoria(req.params.id);
      res.json({ message: "Categoria removida com sucesso" });
    } catch (error: any) {
      console.error("Erro ao remover categoria:", error);
      res.status(500).json({ message: `Erro ao remover categoria: ${error.message}` });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}