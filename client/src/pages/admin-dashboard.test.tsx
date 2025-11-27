import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { AdminDashboard } from './admin-dashboard';
import { useAuth } from '@/context/AuthContext';
import { useMaintenance } from '@/context/MaintenanceContext';
import { api } from '@/lib/api';
// Mock dependencies
vi.mock('@/lib/api', () => ({
  api: {
    getProdutos: vi.fn(),
    getStacks: vi.fn(),
    getCategorias: vi.fn(),
    logout: vi.fn(),
  }
}));
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));
vi.mock('@/context/AuthContext');
vi.mock('@/context/MaintenanceContext');
const mockedUseNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockedUseNavigate,
  };
});
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity, // Prevent refetching during tests
    },
  },
});
const renderWithProviders = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <AdminDashboard />
    </QueryClientProvider>
  );
};
describe('AdminDashboard - Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock API calls to return empty arrays by default
    vi.mocked(api.getProdutos).mockResolvedValue({ produtos: [], total: 0 });
    vi.mocked(api.getStacks).mockResolvedValue([]);
    vi.mocked(api.getCategorias).mockResolvedValue([]);
  });
  it('redirects to home if user is not authenticated', async () => {
    const checkAuth = vi.fn().mockResolvedValue(false);
    vi.mocked(useAuth).mockReturnValue({
      checkAuth,
      logout: vi.fn(),
    } as any);
     vi.mocked(useMaintenance).mockReturnValue({
      maintenanceMode: false,
      setMaintenanceMode: vi.fn(),
    } as any);
    renderWithProviders();
    await waitFor(() => {
      expect(checkAuth).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(mockedUseNavigate).toHaveBeenCalledWith('/');
    });
  });
  it('renders the dashboard if user is authenticated', async () => {
    const checkAuth = vi.fn().mockResolvedValue(true);
    vi.mocked(useAuth).mockReturnValue({
      checkAuth,
      logout: vi.fn(),
    } as any);
     vi.mocked(useMaintenance).mockReturnValue({
      maintenanceMode: false,
      setMaintenanceMode: vi.fn(),
    } as any);
    renderWithProviders();
    
    const heading = await screen.findByRole('heading', { name: /painel administrativo/i });
    expect(heading).toBeInTheDocument();
    expect(await screen.findByText('Produtos')).toBeInTheDocument();
    expect(await screen.findByText('Stacks')).toBeInTheDocument();
    const categories = await screen.findAllByText('Categorias');
    expect(categories.length).toBeGreaterThan(0);
  });
    it('calls logout when the logout button is clicked', async () => {
      const checkAuth = vi.fn().mockResolvedValue(true);
      const logout = vi.fn();
      
      vi.mocked(useAuth).mockReturnValue({
        checkAuth,
        logout,
      } as any);
  
      vi.mocked(useMaintenance).mockReturnValue({
        maintenanceMode: false,
        setMaintenanceMode: vi.fn(),
      } as any);
  
      renderWithProviders();
      
      const logoutButton = await screen.findByRole('button', { name: /sair/i });
      await userEvent.click(logoutButton);
  
      await waitFor(() => {
        expect(logout).toHaveBeenCalled();
      });
    });
  it('toggles maintenance mode', async () => {
    const checkAuth = vi.fn().mockResolvedValue(true);
    const setMaintenanceMode = vi.fn();
    vi.mocked(useAuth).mockReturnValue({
      checkAuth,
      logout: vi.fn(),
    } as any);
    vi.mocked(useMaintenance).mockReturnValue({
      maintenanceMode: false,
      setMaintenanceMode,
    } as any);
    
    renderWithProviders();
    const maintenanceSwitch = await screen.findByRole('switch', { name: /modo de manutenção/i });
    await userEvent.click(maintenanceSwitch);
    await waitFor(() => {
      expect(setMaintenanceMode).toHaveBeenCalledWith(true);
    });
  });
});
