import { render, screen, waitFor, fireEvent } from '@testing-library/react'; // Import fireEvent
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { CategoryStrip } from './CategoryStrip';
import { api } from '@/lib/api';
import userEvent from '@testing-library/user-event';

// Mock the api module
vi.mock('@/lib/api');

// Mock react-router-dom's useNavigate
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
    },
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('CategoryStrip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('shows loading skeletons while fetching categories', async () => {
    // Mock the API to be in a pending state
    vi.mocked(api.getCategorias).mockReturnValue(new Promise(() => {}));

    renderWithProviders(<CategoryStrip />);

    // Check for skeleton elements
    const skeletons = await screen.findAllByRole('generic', {}, { timeout: 4000 });
    expect(skeletons.some(el => el.classList.contains('animate-pulse'))).toBeTruthy();
  });

  it('renders categories on successful fetch', async () => {
    const mockCategories = [
      { id: '1', titulo: 'Eletronicos', color: '#ff0000' },
      { id: '2', titulo: 'Roupas', color: '#00ff00' },
    ];
    vi.mocked(api.getCategorias).mockResolvedValue(mockCategories);

    renderWithProviders(<CategoryStrip />);

    await waitFor(() => {
      expect(screen.getByText('Eletronicos')).toBeInTheDocument();
      expect(screen.getByText('Roupas')).toBeInTheDocument();
    });
  });

  it('navigates to products page with categoryId on category click', async () => {
    const mockCategories = [
      { id: '1', titulo: 'Eletronicos', color: '#ff0000' },
    ];
    vi.mocked(api.getCategorias).mockResolvedValue(mockCategories);

    renderWithProviders(<CategoryStrip />);

    await waitFor(async () => { // Changed to async to await userEvent.click
      await userEvent.click(screen.getByText('Eletronicos'));
    });

    expect(mockedUseNavigate).toHaveBeenCalledWith('/produtos?categoryIds=1');
  });

  it('renders no categories if data is empty', async () => {
    vi.mocked(api.getCategorias).mockResolvedValue([]);

    renderWithProviders(<CategoryStrip />);

    // Ensure no category buttons are rendered
    await waitFor(() => {
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  it('handles wheel scroll to scroll horizontally', async () => {
    vi.mocked(api.getCategorias).mockResolvedValue([]); // No categories needed for this test

    renderWithProviders(<CategoryStrip />);

    const scrollContainer = screen.getByTestId('category-strip-scroll-container');
    
    // Mock scrollLeft property
    Object.defineProperty(scrollContainer, 'scrollLeft', { writable: true, value: 0 });
    Object.defineProperty(scrollContainer, 'scrollWidth', { writable: true, value: 1000 });
    Object.defineProperty(scrollContainer, 'clientWidth', { writable: true, value: 500 });

    const initialScrollLeft = scrollContainer.scrollLeft;
    const scrollAmount = 50;

    // Simulate a wheel event
    fireEvent.wheel(scrollContainer, { deltaY: scrollAmount });

    expect(scrollContainer.scrollLeft).toBe(initialScrollLeft + scrollAmount);
  });
});