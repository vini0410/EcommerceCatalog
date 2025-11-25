
import { render, screen, waitFor } from '@testing-library/react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { MemoryRouter } from 'react-router-dom';

import { vi } from 'vitest';

import { FeaturedStacks } from './featured-stacks';

import { api } from '@/lib/api';

import { LocaleProvider } from '@/context/LocaleContext';

import userEvent from '@testing-library/user-event';



// Mock the api module

vi.mock('@/lib/api');



// Mock ProductCard component

vi.mock('@/components/product-card', () => ({

  ProductCard: vi.fn(({ produto, onViewDetails }) => (

    <div data-testid={`product-card-${produto.id}`} onClick={() => onViewDetails(produto)}>

      <span>{produto.titulo}</span>

      <button onClick={(e) => { e.stopPropagation(); onViewDetails(produto); }}>Ver Detalhes</button>

    </div>

  )),

}));















// Mock ProductModal component







let MockedProductModal: ReturnType<typeof vi.fn>;







vi.mock('@/components/product-modal', () => ({







  ProductModal: (props: any) => {







    MockedProductModal(props); // This will record the calls







    return <div>Mock Product Modal</div>; // This is what actually gets rendered







  },







}));



// Mock react-router-dom's useNavigate

const mockedUseNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {

  const actual = await importOriginal();

  return {

    ...actual,

    useNavigate: () => mockedUseNavigate,

  };

});



// Mock CategoryStrip component to avoid un-mocked API call warning

vi.mock('@/components/CategoryStrip', () => ({

  CategoryStrip: vi.fn(() => <div>Mock Category Strip</div>),

}));





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

      <LocaleProvider>

        <MemoryRouter>{ui}</MemoryRouter>

      </LocaleProvider>

    </QueryClientProvider>

  );

};



describe('FeaturedStacks', () => {

    beforeEach(() => {

      vi.resetAllMocks();

      queryClient.clear();

      MockedProductModal = vi.fn(() => <div>Mock Product Modal</div>); // Initialize MockedProductModal

    });



  it('shows a loading skeleton while fetching data', async () => {

    // Mock the API to be in a pending state

    vi.mocked(api.getStacks).mockReturnValue(new Promise(() => {}));



    renderWithProviders(<FeaturedStacks />);



    // Check for skeleton elements by looking for the animate-pulse class

    const skeletons = await screen.findAllByRole('generic', {}, { timeout: 4000 });

    expect(skeletons.some(el => el.classList.contains('animate-pulse'))).toBeTruthy();

  });



  it('renders stacks and products on successful fetch', async () => {

    const mockStacks = [

      {

        id: '1',

        titulo: 'Stack 1',

        produtos: [

          {

            id: 'p1',

            produto: { id: 'p1', titulo: 'Product 1', valorBruto: 100, fotos: [] },

          },

        ],

      },

    ];



    vi.mocked(api.getStacks).mockResolvedValue(mockStacks);



    renderWithProviders(<FeaturedStacks />);



    // Wait for the loading to finish and content to appear

    await waitFor(() => {

      expect(screen.getByText('Stack 1')).toBeInTheDocument();

      expect(screen.getByText('Product 1')).toBeInTheDocument();

      expect(screen.getByText('Mock Product Modal')).toBeInTheDocument();

    });

  });



  it('shows a message when no stacks are available', async () => {

    vi.mocked(api.getStacks).mockResolvedValue([]);



    renderWithProviders(<FeaturedStacks />);



    await waitFor(() => {

      expect(screen.getByText('Nenhuma coleção disponível')).toBeInTheDocument();

    });

  });



  it('opens product modal on product card click', async () => {

    const mockProduct = { id: 'p1', titulo: 'Product 1', valorBruto: 100, fotos: [] };

    const mockStacks = [

      {

        id: '1',

        titulo: 'Stack 1',

        produtos: [{ id: 'sp1', produto: mockProduct }],

      },

    ];

    vi.mocked(api.getStacks).mockResolvedValue(mockStacks);



    renderWithProviders(<FeaturedStacks />);



    await waitFor(() => {

      const productCard = screen.getByTestId(`product-card-${mockProduct.id}`);

      userEvent.click(productCard);

    });



            await waitFor(() => {



                expect(MockedProductModal).toHaveBeenCalledTimes(2); // Expect two calls: initial render and after click



                expect(MockedProductModal.mock.calls[1][0]).toEqual( // Check the arguments of the second call



                    expect.objectContaining({



                        produto: mockProduct,



                        open: true,



                        onOpenChange: expect.any(Function),



                    })



                );



            });



      });



    



      it('navigates to products page when stack title is clicked', async () => {



        const mockStacks = [



          {



            id: '1',



            titulo: 'Stack 1',



            produtos: [],



          },



        ];



        vi.mocked(api.getStacks).mockResolvedValue(mockStacks);



    



        renderWithProviders(<FeaturedStacks />);



    



        await waitFor(() => {



            const stackLink = screen.getByRole('link', { name: /stack 1/i });



            expect(stackLink).toHaveAttribute('href', '/produtos?stackId=1');



        });



      });



    });



    
