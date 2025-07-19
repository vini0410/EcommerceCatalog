import { apiRequest } from "./queryClient";

export const loginAdmin = async (codigo: string) => {
  const res = await fetch("/api/admin/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ codigo }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Login failed");
  }
  return res.json();
};

export const logoutAdmin = async () => {
  const res = await fetch("/api/admin/logout", { method: "POST" });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Logout failed");
  }
  return res.json();
};

export const checkAuthStatus = async () => {
  const res = await fetch("/api/admin/check");
  if (!res.ok) {
    throw new Error("Failed to check auth status");
  }
  return res.json();
};

export const api = {
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
    const res = await fetch('/api/admin/produtos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(produto)
    });
    if (!res.ok) throw new Error('Erro ao criar produto');
    return res.json();
  },

  async updateProduto(id: string, produto: any) {
    const res = await fetch(`/api/admin/produtos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(produto)
    });
    if (!res.ok) throw new Error('Erro ao atualizar produto');
    return res.json();
  },

  async deleteProduto(id: string) {
    const res = await fetch(`/api/admin/produtos/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Erro ao remover produto');
    return res.json();
  },

  // Admin - Stacks
  async createStack(stack: any) {
    const res = await fetch('/api/admin/stacks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stack)
    });
    if (!res.ok) throw new Error('Erro ao criar stack');
    return res.json();
  },

  async updateStack(id: string, stack: any) {
    const res = await fetch(`/api/admin/stacks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stack)
    });
    if (!res.ok) throw new Error('Erro ao atualizar stack');
    return res.json();
  },

  async deleteStack(id: string) {
    const res = await fetch(`/api/admin/stacks/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Erro ao remover stack');
    return res.json();
  }
};
