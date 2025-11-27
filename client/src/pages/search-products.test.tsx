import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchProducts } from './search-products';
import { api } from '@/lib/api';
import { MemoryRouter, useSearchParams } from 'react-router-dom';
import { LocaleProvider } from '@/context/LocaleContext';
import { Product } from '@/lib/api';

// Mock dependencies
vi.mock('@/lib/api');
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useSearchParams: vi.fn(),
  };
});

const mockedApi = vi.mocked(api);
const mockedUseSearchParams = vi.mocked(useSearchParams);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
});

const renderWithProviders = (initialEntries = ['/produtos']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <QueryClientProvider client={queryClient}>
        <LocaleProvider>
          <SearchProducts />
        </LocaleProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
};

const mockProducts = (count: number, page: number): { total: number; produtos: Product[] } => ({
  total: count,
  produtos: Array.from({ length: count }, (_, i) => ({
    id: `prod${page * 10 + i}`,
    titulo: `Produto ${page * 10 + i}`,
    valorBruto: 100,
    valorDesconto: 80,
    fotos: [],
    categoriaId: '',
    descricao: '',
    disponivel: false,
    lojaId: '',
    createdAt: new Date(),
    updatedAt: new Date()
  })),
});

const mockCategories = [
  { id: 'cat1', titulo: 'Eletronicos', color: '#ff0000', lojaId: 'loja1', order: 0, stackId: null, createdAt: new Date(), updatedAt: new Date()  },
  { id: 'cat2', titulo: 'Roupas', color: '#00ff00', lojaId: 'loja1', order: 0, stackId: null, createdAt: new Date(), updatedAt: new Date() },
];

describe('SearchProducts Page', () => {
  let setSearchParams: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    setSearchParams = vi.fn();
    mockedUseSearchParams.mockReturnValue([new URLSearchParams(), setSearchParams]);
    mockedApi.getProdutos.mockResolvedValue(mockProducts(10, 1));
    mockedApi.getCategorias.mockResolvedValue(mockCategories);
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('renders the search input and initial products', async () => {
    renderWithProviders();

    expect(screen.getByPlaceholderText(/buscar por nome ou código/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(mockedApi.getProdutos).toHaveBeenCalled();
    });

    expect(await screen.findByText('Produto 10')).toBeInTheDocument();
    expect(await screen.findByText('Eletronicos')).toBeInTheDocument();
  });

  it('filters products when user types in search input', async () => {
    renderWithProviders();

    const searchInput = screen.getByPlaceholderText(/buscar por nome ou código/i);
    await userEvent.type(searchInput, 'Test Search');

    await waitFor(() => {
        const newParams = new URLSearchParams();
        newParams.set('q', 'Test Search');
        newParams.set('pagina', '1');
        expect(setSearchParams).toHaveBeenCalledWith(newParams);
    });
  });

  it('filters products when a category is selected', async () => {
    renderWithProviders();

    const categoryButton = await screen.findByText('Eletronicos');
    await userEvent.click(categoryButton);

    await waitFor(() => {
      const newParams = new URLSearchParams();
      newParams.set('categoryIds', 'cat1');
      newParams.set('pagina', '1');
      expect(setSearchParams).toHaveBeenCalledWith(newParams);
    });
  });

  it('changes page when pagination is clicked', async () => {
    mockedApi.getProdutos.mockResolvedValue(mockProducts(30, 1));
    mockedUseSearchParams.mockReturnValue([new URLSearchParams('pagina=1&limite=10'), setSearchParams]);
    renderWithProviders(['/produtos?pagina=1&limite=10']);
  
    const main = screen.getByRole('main');
    const page2Button = await within(main).findByRole('button', { name: '2' });
    await userEvent.click(page2Button);
  
    await waitFor(() => {
      const newParams = new URLSearchParams('pagina=2&limite=10');
      expect(setSearchParams).toHaveBeenCalledWith(newParams);
    });
  });

  it('shows a message when no products are found', async () => {
    mockedApi.getProdutos.mockResolvedValue({ produtos: [], total: 0 });
    renderWithProviders();
    const message = await screen.findByText('Nenhum produto encontrado');
    expect(message).toBeInTheDocument();
  });

  it('opens the product modal when a product card is clicked', async () => {
    renderWithProviders();

    const productCard = await screen.findByText('Produto 10');
    await userEvent.click(productCard);

    expect(await screen.findByRole('heading', { name: /Produto 10/i })).toBeInTheDocument();
  });
});