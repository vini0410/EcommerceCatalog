
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { AdminLoginModal } from './admin-login-modal';
import { loginAdmin } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Mock dependencies
vi.mock('@/lib/api', () => ({
  loginAdmin: vi.fn(),
}));
vi.mock('@/hooks/use-toast');

const mockedUseNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockedUseNavigate,
  };
});

// A more robust mock for the Dialog component
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }) =>
    open ? <div data-testid="dialog" onClick={() => onOpenChange(false)}>{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}));

const mockedToast = vi.fn();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (
  props: React.ComponentProps<typeof AdminLoginModal>
) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <AdminLoginModal {...props} />
    </QueryClientProvider>
  );
};

describe('AdminLoginModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useToast).mockReturnValue({
      toast: mockedToast,
    } as any);
  });

  it('renders the login form correctly', () => {
    renderWithProviders({
      open: true,
      onOpenChange: vi.fn(),
      onLoginSuccess: vi.fn(),
    });

    expect(screen.getByText('Acesso Administrativo')).toBeInTheDocument();
    expect(
      screen.getByText('Digite o código de acesso para entrar na área administrativa')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Código de Acesso')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('allows typing in the access code field', async () => {
    renderWithProviders({
      open: true,
      onOpenChange: vi.fn(),
      onLoginSuccess: vi.fn(),
    });

    const input = screen.getByLabelText('Código de Acesso');
    await userEvent.type(input, 'test-code');
    expect(input).toHaveValue('test-code');
  });

  it('shows an error toast on failed login', async () => {
    const errorMessage = 'Código inválido';
    vi.mocked(loginAdmin).mockRejectedValue(new Error(errorMessage));

    renderWithProviders({
      open: true,
      onOpenChange: vi.fn(),
      onLoginSuccess: vi.fn(),
    });

    await userEvent.type(screen.getByLabelText('Código de Acesso'), 'wrong-code');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(mockedToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Erro no login',
        description: errorMessage,
      });
    });
  });

  it('calls onLoginSuccess and shows success toast on successful login', async () => {
    vi.mocked(loginAdmin).mockResolvedValue({ success: true });
    const onLoginSuccess = vi.fn();
    const onOpenChange = vi.fn();

    renderWithProviders({
      open: true,
      onOpenChange,
      onLoginSuccess,
    });

    await userEvent.type(screen.getByLabelText('Código de Acesso'), 'correct-code');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(mockedToast).toHaveBeenCalledWith({
        title: 'Login realizado com sucesso!',
        description: 'Redirecionando para o painel administrativo...',
      });
      expect(onLoginSuccess).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('disables form elements while login is pending', async () => {
    vi.mocked(loginAdmin).mockReturnValue(new Promise(() => {}));

    renderWithProviders({
      open: true,
      onOpenChange: vi.fn(),
      onLoginSuccess: vi.fn(),
    });

    await userEvent.type(screen.getByLabelText('Código de Acesso'), 'any-code');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Verificando...' })).toBeDisabled();
      expect(screen.getByLabelText('Código de Acesso')).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    });
  });

  it('navigates to home when the dialog is closed by the user', async () => {
    const onOpenChange = vi.fn();

    renderWithProviders({
      open: true,
      onOpenChange,
      onLoginSuccess: vi.fn(),
    });
    
    // Simulate closing the dialog by clicking on the overlay
    await userEvent.click(screen.getByTestId('dialog'));
    
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(mockedUseNavigate).toHaveBeenCalledWith('/');
    });
  });
});
