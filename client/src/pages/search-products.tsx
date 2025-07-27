import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ProductCard } from "@/components/product-card";
import { ProductModal } from "@/components/product-modal";
import { Pagination } from "@/components/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import { type Produto } from "@shared/schema";
import { useLocation } from "wouter";

export function SearchProducts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedProduct, setSelectedProduct] = useState<Produto | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [stackId, setStackId] = useState<string | undefined>(undefined);
  const [, setLocation] = useLocation();

  // Extract search and stackId from URL params on location change
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qParam = params.get('q');
    const stackIdParam = params.get('stackId');

    setSearchQuery(qParam || "");
    setStackId(stackIdParam || undefined);
    setCurrentPage(1); // Reset page when search or stackId changes
  }, [location.search]); // Depend on location.search to react to URL changes

  // Debounce search query and update URL
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (stackId) params.set('stackId', stackId);
      const newUrl = `/buscar${params.toString() ? `?${params.toString()}` : ''}`;
      if (window.location.search !== params.toString()) { // Only update if different
        setLocation(newUrl);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, stackId, setLocation]);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/produtos", searchQuery, currentPage, itemsPerPage, stackId],
    queryFn: () => api.getProdutos(searchQuery, currentPage, itemsPerPage, stackId),
  });

  const handleViewProduct = (produto: Produto) => {
    setSelectedProduct(produto);
    setShowProductModal(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / itemsPerPage) : 0;
  const hasResults = data && data.produtos.length > 0;
  const showNoResults = !isLoading && data && data.produtos.length === 0;

  return (
    <div className="min-h-screen pt-16">
      {/* Search Header */}
      <section className="gradient-bg py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              ✨ Nossos <span className="text-gradient">Produtos</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Encontre exatamente o que você está procurando em nosso catálogo
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome ou código do produto..."
                className="w-full px-6 py-4 pl-12 text-base bg-card shadow-lg border-border rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <>
              {/* Loading Skeleton */}
              <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
                <Skeleton className="h-6 w-48 mb-4 sm:mb-0" />
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-10 w-20" />
                </div>
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
                {searchQuery
                  ? `Não encontramos produtos para "${searchQuery}". Tente buscar com outros termos.`
                  : "Tente buscar por um produto específico usando a barra de pesquisa acima."}
              </p>
            </div>
          ) : hasResults ? (
            <>
              {/* Pagination Info and Controls */}
              <div className="mb-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  totalItems={data.total}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
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
                  />
                </div>
              )}
            </>
          ) : null}
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
