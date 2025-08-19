import { apiRequest } from "./queryClient";

const API_BASE_URL = import.meta.env.VITE_PUBLIC_API_URL || "";

export const loginAdmin = async (codigo: string) => {
  const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
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
    throw new Error(`Login failed: ${errorMessage}`); // Modified message
  }
  return res.json();
};

export const logoutAdmin = async () => {
  const res = await fetch(`${API_BASE_URL}/api/admin/logout`, { method: "POST" });
  if (!res.ok) {
    let errorMessage = `HTTP error! Status: ${res.status}`;
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      const errorText = await res.text();
      errorMessage = `Server responded with: ${errorText || res.statusText || errorMessage}`;
    }
    throw new Error(`Logout failed: ${errorMessage}`); // Modified message
  }
  return res.json();
};

export const checkAuthStatus = async () => {
  const res = await fetch(`${API_BASE_URL}/api/admin/check`);
  if (!res.ok) {
    let errorMessage = `HTTP error! Status: ${res.status}`;
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      const errorText = await res.text();
      errorMessage = `Server responded with: ${errorText || res.statusText || errorMessage}`;
    }
    throw new Error(`Failed to check auth status: ${errorMessage}`); // Modified message
  }
  return res.json();
};

export const api = {
  // This is a dummy comment to force a file change and trigger a rebuild.

  // Produtos públicos
  async getProdutos(q?: string, page?: number, limit?: number, stackId?: string, categoryIds?: string, includeInactive?: boolean) {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    if (stackId) params.append('stackId', stackId);
    if (categoryIds) params.append('categoryIds', categoryIds);
    if (includeInactive) params.append('includeInactive', 'true');
    
    const url = `${API_BASE_URL}/api/produtos${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) {
      let errorMessage = `HTTP error! Status: ${res.status}`;
      try {
        const errorData = await res.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        const errorText = await res.text();
        errorMessage = `Server responded with: ${errorText || res.statusText || errorMessage}`;
      }
      throw new Error(`Erro ao buscar produtos: ${errorMessage}`); // Modified message
    }
    return res.json();
  },

  async getProdutoById(id: string) {
    const res = await fetch(`${API_BASE_URL}/api/produtos/${id}`);
    if (!res.ok) {
      let errorMessage = `HTTP error! Status: ${res.status}`;
      try {
        const errorData = await res.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        const errorText = await res.text();
        errorMessage = `Server responded with: ${errorText || res.statusText || errorMessage}`;
      }
      throw new Error(`Produto não encontrado: ${errorMessage}`); // Modified message
    }
    return res.json();
  },

  // Stacks públicas
  async getStacks(includeInactive?: boolean) {
    const params = new URLSearchParams();
    if (includeInactive) params.append('includeInactive', 'true');
    const url = `${API_BASE_URL}/api/stacks${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) {
      let errorMessage = `HTTP error! Status: ${res.status}`;
      try {
        const errorData = await res.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        const errorText = await res.text();
        errorMessage = `Server responded with: ${errorText || res.statusText || errorMessage}`;
      }
      throw new Error(`Erro ao buscar stacks: ${errorMessage}`); // Modified message
    }
    return res.json();
  },

  // Admin - Produtos
  async createProduto(produto: any) {
    const res = await fetch(`${API_BASE_URL}/api/admin/produtos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(produto)
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
      throw new Error(`Erro ao criar produto: ${errorMessage}`); // Modified message
    }
    return res.json();
  },

  async updateProduto(id: string, produto: any) {
    const res = await fetch(`${API_BASE_URL}/api/admin/produtos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(produto)
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
      throw new Error(`Erro ao atualizar produto: ${errorMessage}`); // Modified message
    }
    return res.json();
  },

  async deleteProduto(id: string) {
    const res = await fetch(`${API_BASE_URL}/api/admin/produtos/${id}`, {
      method: 'DELETE',
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
      throw new Error(`Erro ao remover produto: ${errorMessage}`); // Modified message
    }
    return res.json();
  },

  async toggleProdutoStatus(id: string) {
    const res = await fetch(`${API_BASE_URL}/api/admin/produtos/${id}/toggle-status`, {
      method: 'PUT',
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
      throw new Error(`Erro ao alternar status do produto: ${errorMessage}`); // Modified message
    }
    return res.json();
  },

  // Admin - Stacks
  async createStack(stack: any) {
    const res = await fetch(`${API_BASE_URL}/api/admin/stacks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stack)
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
      throw new Error(`Erro ao criar stack: ${errorMessage}`); // Modified message
    }
    return res.json();
  },

  async updateStack(id: string, stack: any) {
    const res = await fetch(`${API_BASE_URL}/api/admin/stacks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stack)
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
      throw new Error(`Erro ao atualizar stack: ${errorMessage}`); // Modified message
    }
    return res.json();
  },

  async deleteStack(id: string) {
    const res = await fetch(`${API_BASE_URL}/api/admin/stacks/${id}`, {
      method: 'DELETE',
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
      throw new Error(`Erro ao remover stack: ${errorMessage}`); // Modified message
    }
    return res.json();
  },

  async toggleStackStatus(id: string) {
    const res = await fetch(`${API_BASE_URL}/api/admin/stacks/${id}/toggle-status`, {
      method: 'PUT',
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
      throw new Error(`Erro ao alternar status da stack: ${errorMessage}`); // Modified message
    }
    return res.json();
  },

  async reorderStacks(stacks: { id: string; ordem: number }[]) {
    console.log("reorder data: ", stacks);
    const res = await fetch(`${API_BASE_URL}/api/admin/stacks/reorder`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stacks),
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
      throw new Error(`Erro ao reordenar stacks: ${errorMessage}`); // Modified message
    }
    return res.json();
  },

  // Categorias
  async getCategorias(includeInactive?: boolean) {
    const params = new URLSearchParams();
    if (includeInactive) params.append('includeInactive', 'true');
    const url = `${API_BASE_URL}/api/categorias${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) {
      let errorMessage = `HTTP error! Status: ${res.status}`;
      try {
        const errorData = await res.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        const errorText = await res.text();
        errorMessage = `Server responded with: ${errorText || res.statusText || errorMessage}`;
      }
      throw new Error(`Erro ao buscar categorias: ${errorMessage}`);
    }
    return res.json();
  },

  async createCategoria(categoria: any) {
    const res = await fetch(`${API_BASE_URL}/api/admin/categorias`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(categoria)
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
      throw new Error(`Erro ao criar categoria: ${errorMessage}`);
    }
    return res.json();
  },

  async updateCategoria(id: string, categoria: any) {
    const res = await fetch(`${API_BASE_URL}/api/admin/categorias/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(categoria)
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
      throw new Error(`Erro ao atualizar categoria: ${errorMessage}`);
    }
    return res.json();
  },

  async deleteCategoria(id: string) {
    const res = await fetch(`${API_BASE_URL}/api/admin/categorias/${id}`, {
      method: 'DELETE',
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
      throw new Error(`Erro ao remover categoria: ${errorMessage}`);
    }
    return res.json();
  },

  async toggleCategoriaStatus(id: string) {
    const res = await fetch(`${API_BASE_URL}/api/admin/categorias/${id}/toggle-status`, {
      method: 'PUT',
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
      throw new Error(`Erro ao alternar status da categoria: ${errorMessage}`);
    }
    return res.json();
  }
};