
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // Re-add QueryClient and QueryClientProvider
import { ProductModal } from './product-modal';
import { type Produto, type Categoria } from '@shared/schema';
import { LocaleProvider } from '../context/LocaleContext';
import { vi } from 'vitest';

// Mock UI components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, onOpenChange, children }: any) => (
    <div data-testid="dialog" onClick={() => onOpenChange(false)}>
      {open ? children : null}
    </div>
  ),
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
}));
vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className, style }: any) => (
    <span data-testid="badge" className={className} style={style}>
      {children}
    </span>
  ),
}));
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    ImageIcon: (props: any) => <span data-testid="image-icon" {...props} />,
    MessageCircle: (props: any) => <span data-testid="message-circle" {...props} />,
  };
});

const mockOnOpenChange = vi.fn();

const mockCategory: Categoria = {
  id: 'cat1',
  titulo: 'Eletronicos',
  color: '#FF0000',
  ativo: true,
  criadoEm: new Date(),
  atualizadoEm: new Date(),
};

const mockProductWithAllDetails: Produto & { categorias?: Categoria[] } = {
  id: 'prod1',
  titulo: 'Smartphone X',
  valorBruto: 1000,
  valorDesconto: 800,
  descontoCalculado: 20,
  descricao: 'Um smartphone incrível com muitos recursos.',
  fotos: ['image1.jpg', 'image2.jpg'],
  ativo: true,
  criadoEm: new Date(),
  atualizadoEm: new Date(),
  categorias: [mockCategory],
};

const mockProductMinimalDetails: Produto & { categorias?: Categoria[] } = {
  id: 'prod2',
  titulo: 'Cadeira Simples',
  valorBruto: 50,
  valorDesconto: null,
  descontoCalculado: null,
  descricao: null,
  fotos: [],
  ativo: true,
  criadoEm: new Date(),
  atualizadoEm: new Date(),
  categorias: [],
};

// Helper function to dynamically import ProductModal after setting global mocks
async function importProductModalDynamically(isMobile: boolean) {
  // Save original properties
  const originalInnerWidth = window.innerWidth;
  const originalMaxTouchPoints = navigator.maxTouchPoints;
  const originalOnTouchStart = window.ontouchstart;

  // Set properties based on isMobile flag
  Object.defineProperty(window, 'innerWidth', { writable: true, value: isMobile ? 700 : 1024 });
  Object.defineProperty(navigator, 'maxTouchPoints', { writable: true, value: isMobile ? 1 : 0 });
  Object.defineProperty(window, 'ontouchstart', { writable: true, value: isMobile ? () => {} : undefined });

  // Dynamically import the module
  const { ProductModal: DynamicProductModal } = await vi.importActual<typeof import('./product-modal')>('./product-modal');

  // Restore original properties
  Object.defineProperty(window, 'innerWidth', { writable: true, value: originalInnerWidth });
  Object.defineProperty(navigator, 'maxTouchPoints', { writable: true, value: originalMaxTouchPoints });
  Object.defineProperty(window, 'ontouchstart', { writable: true, value: originalOnTouchStart });

  return DynamicProductModal;
}




// Mock global window and navigator properties for specific tests
// This is done in individual tests to control the evaluation of isMobileOrTablet
// which is defined at the module level in product-modal.tsx.

vi.stubGlobal('innerWidth', 1024);
vi.stubGlobal('navigator', { maxTouchPoints: 0 });
vi.stubGlobal('ontouchstart', undefined);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (produto: Produto | null, open: boolean) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <ProductModal produto={produto} open={open} onOpenChange={mockOnOpenChange} />
      </LocaleProvider>
    </QueryClientProvider>
  );
};

describe('ProductModal', () => {


  it('does not render when product is null', () => {
    const { queryByTestId } = renderWithProviders(null, true);
    expect(queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('renders product details correctly when open', () => {
    renderWithProviders(mockProductWithAllDetails, true);
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('Smartphone X');
    expect(screen.getByText('R$ 800.00')).toBeInTheDocument(); // Final price
    expect(screen.getByText('R$ 1000.00')).toBeInTheDocument(); // Original price
    expect(screen.getByText('Um smartphone incrível com muitos recursos.')).toBeInTheDocument();
    expect(screen.getByText('-20% OFF')).toBeInTheDocument(); // Discount badge
    expect(screen.getByText('Eletronicos')).toBeInTheDocument(); // Category badge
  });

  it('displays image when product has photos', () => {
    renderWithProviders(mockProductWithAllDetails, true);
    expect(screen.getByAltText('Smartphone X')).toHaveAttribute('src', 'image1.jpg');
    expect(screen.queryByTestId('image-icon')).not.toBeInTheDocument();
  });

  it('displays placeholder icon when product has no photos', () => {
    renderWithProviders(mockProductMinimalDetails, true);
    expect(screen.getByTestId('image-icon')).toBeInTheDocument();
    expect(screen.queryByAltText('Cadeira Simples')).not.toBeInTheDocument();
  });

  it('updates selected image on thumbnail click', () => {
    renderWithProviders(mockProductWithAllDetails, true);
    const thumbnail2 = screen.getByAltText('Smartphone X 2');
    fireEvent.click(thumbnail2);
    expect(screen.getByAltText('Smartphone X')).toHaveAttribute('src', 'image2.jpg');
  });

  it('calls onOpenChange when dialog is closed', () => {
    renderWithProviders(mockProductWithAllDetails, true);
    fireEvent.click(screen.getByTestId('dialog')); // Simulate clicking outside to close
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('generates correct WhatsApp link for non-mobile environment', async () => {
    const DynamicProductModal = await importProductModalDynamically(false); // Non-mobile
    render(
      <QueryClientProvider client={queryClient}>
        <LocaleProvider>
          <DynamicProductModal produto={mockProductWithAllDetails} open={true} onOpenChange={mockOnOpenChange} />
        </LocaleProvider>
      </QueryClientProvider>
    );

    const whatsappLink = screen.getByLabelText('Contact via WhatsApp');
    const expectedMessage = encodeURIComponent(`Olá, tenho interesse no produto: *Smartphone X* 
Valor: R$ 800.00 
Codigo do Produto: prod1`);
    const expectedUrl = `https://web.whatsapp.com/send?phone=5548996551074&text=${expectedMessage}`;
    expect(whatsappLink).toHaveAttribute('href', expectedUrl);
  });

  it('generates correct WhatsApp link for mobile environment', async () => {
    const DynamicProductModal = await importProductModalDynamically(true); // Mobile
    render(
      <QueryClientProvider client={queryClient}>
        <LocaleProvider>
          <DynamicProductModal produto={mockProductWithAllDetails} open={true} onOpenChange={mockOnOpenChange} />
        </LocaleProvider>
      </QueryClientProvider>
    );

    const whatsappLink = screen.getByLabelText('Contact via WhatsApp');
    const expectedMessage = encodeURIComponent(`Olá, tenho interesse no produto: *Smartphone X* 
Valor: R$ 800.00 
Codigo do Produto: prod1`);
    const expectedUrl = `https://wa.me/5548996551074?text=${expectedMessage}`;
    expect(whatsappLink).toHaveAttribute('href', expectedUrl);
  });
});
