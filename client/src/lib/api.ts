import { apiRequest } from "./queryClient";

let adminToken: string | null = localStorage.getItem('admin-token');

export const api = {
  // Admin auth
  async loginAdmin(codigo: string) {
    const res = await apiRequest("POST", "/api/admin/login", { codigo });
    const data = await res.json();
    adminToken = data.token;
    localStorage.setItem('admin-token', adminToken);
    return data;
  },

  async logoutAdmin() {
    if (!adminToken) return;
    await apiRequest("POST", "/api/admin/logout", undefined);
    adminToken = null;
    localStorage.removeItem('admin-token');
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
    const res = await fetch('/api/admin/produtos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(produto)
    });
    if (!res.ok) throw new Error('Erro ao criar produto');
    return res.json();
  },

  async updateProduto(id: string, produto: any) {
    if (!adminToken) throw new Error('Token administrativo necessário');
    const res = await fetch(`/api/admin/produtos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(produto)
    });
    if (!res.ok) throw new Error('Erro ao atualizar produto');
    return res.json();
  },

  async deleteProduto(id: string) {
    if (!adminToken) throw new Error('Token administrativo necessário');
    const res = await fetch(`/api/admin/produtos/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (!res.ok) throw new Error('Erro ao remover produto');
    return res.json();
  },

  // Admin - Stacks
  async createStack(stack: any) {
    if (!adminToken) throw new Error('Token administrativo necessário');
    const res = await fetch('/api/admin/stacks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(stack)
    });
    if (!res.ok) throw new Error('Erro ao criar stack');
    return res.json();
  },

  async updateStack(id: string, stack: any) {
    if (!adminToken) throw new Error('Token administrativo necessário');
    const res = await fetch(`/api/admin/stacks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(stack)
    });
    if (!res.ok) throw new Error('Erro ao atualizar stack');
    return res.json();
  },

  async deleteStack(id: string) {
    if (!adminToken) throw new Error('Token administrativo necessário');
    const res = await fetch(`/api/admin/stacks/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (!res.ok) throw new Error('Erro ao remover stack');
    return res.json();
  }
};

// Initialize admin token
if (adminToken) {
  // Validate token on app startup
  fetch('/api/admin/produtos', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }).catch(() => {
    // Invalid token, clear it
    adminToken = null;
    localStorage.removeItem('admin-token');
  });
}
