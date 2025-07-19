import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProdutoSchema, insertStackSchema, insertStackProdutoSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware para validação de admin
  const requireAdmin = async (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !(await storage.validateSessaoAdmin(token))) {
      return res.status(401).json({ message: 'Acesso não autorizado' });
    }
    next();
  };

  // Produtos públicos
  app.get("/api/produtos", async (req, res) => {
    try {
      const { search, page = 1, limit = 20 } = req.query;
      const resultado = await storage.getProdutos(
        search as string,
        parseInt(page as string),
        parseInt(limit as string)
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
      const stacks = await storage.getStacks();
      res.json(stacks);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar stacks" });
    }
  });

  // Login admin
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { codigo } = req.body;
      const codigoAdmin = process.env.ADMIN_CODE || "admin123";
      
      if (codigo !== codigoAdmin) {
        return res.status(401).json({ message: "Código de acesso inválido" });
      }

      // Criar sessão admin
      const token = crypto.randomUUID();
      const expiraEm = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
      
      await storage.createSessaoAdmin({
        token,
        expiraEm,
        ativo: true
      });

      res.json({ token });
    } catch (error) {
      res.status(500).json({ message: "Erro no login administrativo" });
    }
  });

  app.post("/api/admin/logout", requireAdmin, async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        await storage.deleteSessaoAdmin(token);
      }
      res.json({ message: "Logout realizado com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro no logout" });
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
      const stackData = insertStackSchema.parse(req.body);
      const stack = await storage.createStack(stackData);
      res.status(201).json(stack);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao criar stack" });
    }
  });

  app.put("/api/admin/stacks/:id", requireAdmin, async (req, res) => {
    try {
      const stackData = insertStackSchema.partial().parse(req.body);
      const stack = await storage.updateStack(req.params.id, stackData);
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

  const httpServer = createServer(app);
  return httpServer;
}
