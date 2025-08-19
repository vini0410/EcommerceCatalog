import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ProductCard } from "@/components/product-card";
import { ProductModal } from "@/components/product-modal";
import { Pagination } from "@/components/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import { type Produto, type Categoria } from "@shared/schema";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function SearchProducts() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive state from URL search params
  const searchQuery = searchParams.get("q") || "";
  const stackId = searchParams.get("stackId") || undefined;
  const currentPage = parseInt(searchParams.get("pagina") || "1");
  const itemsPerPage = parseInt(searchParams.get("limite") || "20");
  const categoryIds = searchParams.get("categoryIds")?.split(',') || [];

  // Local state for debouncing search input
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  
  const [selectedProduct, setSelectedProduct] = useState<Produto | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (debouncedSearchQuery !== searchQuery) {
        handleSearchChange(debouncedSearchQuery);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [debouncedSearchQuery]);

  // Update debounced search query when URL changes
  useEffect(() => {
    setDebouncedSearchQuery(searchQuery);
  }, [searchQuery]);

  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery<Categoria[]>({
    queryKey: ["/api/categorias"],
    queryFn: () => api.getCategorias(),
    staleTime: Infinity,
  });

  const { data, isLoading, isFetching } = useQuery<{
    total: number;
    produtos: Produto[];
  }>({
    queryKey: ["/api/produtos", searchQuery, currentPage, itemsPerPage, stackId, categoryIds.join(',')],
    queryFn: () => api.getProdutos(searchQuery, currentPage, itemsPerPage, stackId, categoryIds.join(',')),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const handleViewProduct = (produto: Produto) => {
    setSelectedProduct(produto);
    setShowProductModal(true);
  };

  const handleSearchChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set("q", value);
    } else {
      newParams.delete("q");
    }
    newParams.set("pagina", "1");
    setSearchParams(newParams);
  };

  const handleCategoryChange = (newCategoryIds: string[]) => {
    const newParams = new URLSearchParams(searchParams);
    if (newCategoryIds.length > 0) {
      newParams.set("categoryIds", newCategoryIds.join(','));
    } else {
      newParams.delete("categoryIds");
    }
    newParams.set("pagina", "1");
    setSearchParams(newParams);
  };

  const handlePageChange = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("pagina", page.toString());
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("limite", newItemsPerPage.toString());
    newParams.set("pagina", "1"); // Reset to page 1
    setSearchParams(newParams);
  };

  const totalPages = data ? Math.ceil(data.total / itemsPerPage) : 0;
  const hasResults = !isLoading && data && data.produtos.length > 0;
  const showNoResults = !isLoading && data && data.produtos.length === 0;

  return (
    <div className="min-h-screen pt-16">
      {/* Search Header */}
      <section className="gradient-bg py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-4">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              ✨ Nossos <span className="text-gradient">Produtos</span>
            </h1>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              Encontre exatamente o que você está procurando em nosso catálogo
            </p>
          </div>

          
        </div>
      </section>

      {/* Results Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
            <div className="relative w-full sm:w-auto flex-grow">
              <Input
                type="text"
                value={debouncedSearchQuery}
                onChange={(e) => setDebouncedSearchQuery(e.target.value)}
                placeholder="Buscar por nome ou código do produto..."
                className="w-full px-6 py-3 pl-10 text-base bg-card shadow-sm border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            {hasResults && ( // Only show pagination if there are results
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalItems={data.total}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                itemsPerPageOptions={[20, 50, 100]}
              />
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8 items-start">
            {/* Left Sidebar for Category Filters */}
            <aside className="space-y-4 md:sticky md:top-24">
              <h3 className="text-lg font-semibold mb-4">Filtrar por Categoria</h3>
              {isLoadingCategories ? (
                <div className="flex flex-wrap justify-center gap-2">
                  <Skeleton className="h-8 w-24 rounded-full" />
                  <Skeleton className="h-8 w-24 rounded-full" />
                  <Skeleton className="h-8 w-24 rounded-full" />
                </div>
              ) : (
                <ToggleGroup
                  type="multiple"
                  value={categoryIds}
                  onValueChange={handleCategoryChange}
                  className="flex flex-col gap-2"
                >
                  {categoriesData?.map((category) => {
                    const isSelected = categoryIds.includes(category.id);
                    const color = category.color || '#818cf8'; // Cor padrão (indigo-400)

                    // Função para garantir o contraste do texto
                    const getContrastColor = (hexColor: string) => {
                      if (!hexColor) return '#ffffff';
                      const cleanHex = hexColor.startsWith('#') ? hexColor.slice(1) : hexColor;
                      if (cleanHex.length !== 6) return '#ffffff'; // Retorna branco para hex inválido
                      const r = parseInt(cleanHex.substring(0, 2), 16);
                      const g = parseInt(cleanHex.substring(2, 4), 16);
                      const b = parseInt(cleanHex.substring(4, 6), 16);
                      const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
                      return luminance > 186 ? '#000000' : '#ffffff';
                    };

                    const textColor = getContrastColor(color);

                    const style: React.CSSProperties = {
                      transition: 'all 0.2s ease-in-out',
                      borderWidth: '2px',
                      borderColor: color,
                      boxShadow: isSelected ? `0 0 12px -2px ${color}` : 'none',
                    };

                    if (isSelected) {
                      style.backgroundColor = color;
                      style.color = textColor;
                    } else {
                      style.backgroundColor = 'transparent';
                      style.color = 'inherit';
                      style.borderColor = color + '80'; // Borda com transparência
                    }

                    return (
                      <ToggleGroupItem
                        key={category.id}
                        value={category.id}
                        aria-label={`Toggle ${category.titulo}`}
                        className="rounded-full px-4 py-1.5 text-sm font-semibold transform hover:scale-105 hover:shadow-lg"
                        style={style}
                      >
                        {category.titulo}
                      </ToggleGroupItem>
                    );
                  })}
                </ToggleGroup>
              )}
            </aside>

            {/* Right Main Content for Products */}
            <main className="space-y-8">
              {stackId && (
                <div className="text-center mb-12 bg-card border border-border p-4 rounded-2xl shadow-lg">
                  <h2 className="text-xl font-semibold text-foreground">Filtrando por uma stack específica</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Para ver todos os produtos, navegue para a página de produtos sem o filtro de stack.
                  </p>
                </div>
              )}
              {isLoading ? (
                <>
                  {/* Loading Skeleton */}
                  <div className="flex justify-center mb-8">
                    <Skeleton className="h-10 w-full max-w-lg" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: itemsPerPage }).map((_, i) => (
                      <Card key={i} className="overflow-hidden">
                        <Skeleton className="h-64 w-full" />
                        <CardContent className="p-6">
                          <Skeleton className="h-6 w-full mb-2" />
                          <Skeleton className="h-4 w-24 mb-3" />
                          <Skeleton className="h-10 w-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              ) : showNoResults ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Nenhum produto encontrado
                  </h3>
                  <p className="text-muted-foreground">
                    {searchQuery || categoryIds.length > 0
                      ? `Não encontramos produtos para os filtros aplicados. Tente uma combinação diferente.`
                      : "Tente buscar por um produto específico usando a barra de pesquisa acima."}
                  </p>
                </div>
              ) : hasResults ? (
                <>
                  {/* Products Grid */}
                  <div
                    className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12 transition-opacity duration-300 ${
                      isFetching ? "opacity-50" : "opacity-100"
                    }`}
                  >
                    {data.produtos.map((produto: Produto) => (
                      <ProductCard
                        key={produto.id}
                        produto={produto}
                        onViewDetails={handleViewProduct}
                      />
                    ))}
                  </div>

                  {/* Bottom Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        itemsPerPage={itemsPerPage}
                        totalItems={data.total}
                        onPageChange={handlePageChange}
                        onItemsPerPageChange={handleItemsPerPageChange}
                        showPerPageSelector={false}
                      />
                    </div>
                  )}
                </>
              ) : null}
            </main>
          </div>
        </div>
        </div>
      </section>

      <ProductModal
        produto={selectedProduct}
        open={showProductModal}
        onOpenChange={setShowProductModal}
      />
    </div>
  );
}