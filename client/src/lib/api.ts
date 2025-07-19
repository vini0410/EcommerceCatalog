import { apiRequest } from "./queryClient";

let adminToken: string | null = localStorage.getItem('admin-token');

export const api = {
  // Admin auth
  async loginAdmin(codigo: string) {
    const res = await apiRequest("POST", "/api/admin/login", { codigo });
    const data = await res.json();
    adminToken = data.token;
    if (adminToken) {
      localStorage.setItem('admin-token', adminToken);
    }
    return data;
  },

  async logoutAdmin() {
    try {
      if (adminToken) {
        await apiRequest("POST", "/api/admin/logout", undefined, adminToken);
      }
    } catch (error) {
      console.error("Erro durante o logout no servidor:", error);
      // Continuar para limpar o estado do cliente, mesmo que o logout do servidor falhe
    } finally {
      adminToken = null;
      localStorage.removeItem('admin-token');
    }
  },

  // Produtos públicos
  async getProdutos(search?: string, page?: number, limit?: number) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    
    const url = `/api/produtos${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Erro ao buscar produtos');
    return res.json();
  },

  async getProdutoById(id: string) {
    const res = await fetch(`/api/produtos/${id}`);
    if (!res.ok) throw new Error('Produto não encontrado');
    return res.json();
  },

  // Stacks públicas
  async getStacks() {
    const res = await fetch('/api/stacks');
    if (!res.ok) throw new Error('Erro ao buscar stacks');
    return res.json();
  },

  // Admin - Produtos
  async createProduto(produto: any) {
    if (!adminToken) throw new Error('Token administrativo necessário');
    const res = await apiRequest("POST", "/api/admin/produtos", produto, adminToken);
    return res.json();
  },

  async updateProduto(id: string, produto: any) {
    if (!adminToken) throw new Error('Token administrativo necessário');
    const res = await apiRequest("PUT", `/api/admin/produtos/${id}`, produto, adminToken);
    return res.json();
  },

  async deleteProduto(id: string) {
    if (!adminToken) throw new Error('Token administrativo necessário');
    const res = await apiRequest("DELETE", `/api/admin/produtos/${id}`, undefined, adminToken);
    return res.json();
  },

  // Admin - Stacks
  async createStack(stack: any) {
    if (!adminToken) throw new Error('Token administrativo necessário');
    const res = await apiRequest("POST", "/api/admin/stacks", stack, adminToken);
    return res.json();
  },

  async updateStack(id: string, stack: any) {
    if (!adminToken) throw new Error('Token administrativo necessário');
    const res = await apiRequest("PUT", `/api/admin/stacks/${id}`, stack, adminToken);
    return res.json();
  },

  async deleteStack(id: string) {
    if (!adminToken) throw new Error('Token administrativo necessário');
    const res = await apiRequest("DELETE", `/api/admin/stacks/${id}`, undefined, adminToken);
    return res.json();
  }
};


