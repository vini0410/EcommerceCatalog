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
    let errorMessage = `HTTP error! Status: ${res.status}`;
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      const errorText = await res.text();
      errorMessage = `Server responded with: ${errorText || res.statusText || errorMessage}`;
    }
    throw new Error(errorMessage);
  }
  return res.json();
};

export const logoutAdmin = async () => {
  const res = await fetch("/api/admin/logout", { method: "POST" });
  if (!res.ok) {
    let errorMessage = `HTTP error! Status: ${res.status}`;
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      const errorText = await res.text();
      errorMessage = `Server responded with: ${errorText || res.statusText || errorMessage}`;
    }
    throw new Error(errorMessage);
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
  async getProdutos(search?: string, page?: number, limit?: number, stackId?: string, includeInactive?: boolean) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    if (stackId) params.append('stackId', stackId);
    if (includeInactive) params.append('includeInactive', 'true');
    
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
  async getStacks(includeInactive?: boolean) {
    const params = new URLSearchParams();
    if (includeInactive) params.append('includeInactive', 'true');
    const url = `/api/stacks${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url);
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
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Erro ao criar produto');
    }
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
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Erro ao atualizar produto');
    }
    return res.json();
  },

  async deleteProduto(id: string) {
    const res = await fetch(`/api/admin/produtos/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Erro ao remover produto');
    return res.json();
  },

  async toggleProdutoStatus(id: string) {
    const res = await fetch(`/api/admin/produtos/${id}/toggle-status`, {
      method: 'PUT',
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Erro ao alternar status do produto');
    }
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
  },

  async toggleStackStatus(id: string) {
    const res = await fetch(`/api/admin/stacks/${id}/toggle-status`, {
      method: 'PUT',
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Erro ao alternar status da stack');
    }
    return res.json();
  },

  async reorderStacks(data: { stacks: { id: string; ordem: number }[] }) {
    console.log("reorder data: ", data);
    const res = await fetch('/api/admin/stacks/reorder', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Erro ao reordenar stacks');
    }
    return res.json();
  }
};