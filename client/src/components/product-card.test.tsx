
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from './product-card';
import { type Produto } from '@shared/schema';
import { LocaleProvider } from '../context/LocaleContext';
import { vi } from 'vitest';

const mockOnViewDetails = vi.fn();

const mockProductWithDiscount: Produto = {
  id: 'prod1',
  titulo: 'Produto com Desconto',
  valorBruto: 100,
  valorDesconto: 80,
  descontoCalculado: 20,
  fotos: ['image1.jpg'],
  ativo: true,
  criadoEm: new Date(),
  atualizadoEm: new Date(),
};

const mockProductNoDiscount: Produto = {
  id: 'prod2',
  titulo: 'Produto Sem Desconto',
  valorBruto: 120,
  valorDesconto: null,
  descontoCalculado: null,
  fotos: ['image2.jpg'],
  ativo: true,
  criadoEm: new Date(),
  atualizadoEm: new Date(),
};

const mockProductNoImage: Produto = {
  id: 'prod3',
  titulo: 'Produto Sem Imagem',
  valorBruto: 50,
  valorDesconto: null,
  descontoCalculado: null,
  fotos: [],
  ativo: true,
  criadoEm: new Date(),
  atualizadoEm: new Date(),
};

const renderWithProviders = (produto: Produto) => {
  return render(
    <LocaleProvider>
      <ProductCard produto={produto} onViewDetails={mockOnViewDetails} />
    </LocaleProvider>
  );
};

describe('ProductCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders product title and price correctly for product with discount', () => {
    renderWithProviders(mockProductWithDiscount);
    expect(screen.getByText('Produto com Desconto')).toBeInTheDocument();
    expect(screen.getByText('R$ 80,00')).toBeInTheDocument(); // Final price
    expect(screen.getByText('R$ 100,00')).toBeInTheDocument(); // Original price
    expect(screen.getByText('-20%')).toBeInTheDocument(); // Discount badge
  });

  it('renders product title and price correctly for product without discount', () => {
    renderWithProviders(mockProductNoDiscount);
    expect(screen.getByText('Produto Sem Desconto')).toBeInTheDocument();
    expect(screen.getByText('R$ 120,00')).toBeInTheDocument(); // Final price
    expect(screen.queryByText(/line-through/i)).not.toBeInTheDocument(); // No original price
    expect(screen.queryByText(/%/)).not.toBeInTheDocument(); // No discount badge
  });

  it('displays image when product has photos', () => {
    renderWithProviders(mockProductWithDiscount);
    expect(screen.getByAltText('Produto com Desconto')).toBeInTheDocument();
    expect(screen.getByAltText('Produto com Desconto')).toHaveAttribute('src', 'image1.jpg');
  });

  it('displays placeholder icon when product has no photos', () => {
    renderWithProviders(mockProductNoImage);
    expect(screen.getByTestId('image-icon-placeholder')).toBeInTheDocument(); // Need to add data-testid to ImageIcon
  });

  it('calls onViewDetails when the card is clicked', () => {
    renderWithProviders(mockProductNoDiscount);
    fireEvent.click(screen.getByText('Produto Sem Desconto').closest('.product-card')!);
    expect(mockOnViewDetails).toHaveBeenCalledTimes(1);
    expect(mockOnViewDetails).toHaveBeenCalledWith(mockProductNoDiscount);
  });

  it('calls onViewDetails when "Ver Detalhes" button is clicked and stops propagation', () => {
    renderWithProviders(mockProductWithDiscount);
    const viewDetailsButton = screen.getByRole('button', { name: /ver detalhes/i });
    
    const clickSpy = vi.fn();
    viewDetailsButton.addEventListener('click', clickSpy);

    fireEvent.click(viewDetailsButton);

    expect(mockOnViewDetails).toHaveBeenCalledTimes(1);
    expect(mockOnViewDetails).toHaveBeenCalledWith(mockProductWithDiscount);
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});