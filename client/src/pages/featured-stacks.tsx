import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProductCard } from "@/components/product-card";
import { ProductModal } from "@/components/product-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { type Produto } from "@shared/schema";
import { useLocation } from "wouter";

export function FeaturedStacks() {
  const [selectedProduct, setSelectedProduct] = useState<Produto | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [, setLocation] = useLocation();

  const { data: stacks, isLoading } = useQuery({
    queryKey: ["/api/stacks"],
    queryFn: () => api.getStacks(),
  });

  const handleViewProduct = (produto: Produto) => {
    setSelectedProduct(produto);
    setShowProductModal(true);
  };

  const handleViewAllProducts = () => {
    setLocation("/buscar");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-16">
        {/* Hero Section Skeleton */}
        <section className="gradient-bg py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <Skeleton className="h-12 w-96 mx-auto mb-4" />
              <Skeleton className="h-6 w-full max-w-2xl mx-auto" />
            </div>
          </div>
        </section>

        {/* Stacks Skeleton */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-16">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-8">
                <Skeleton className="h-8 w-64" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map((j) => (
                    <Card key={j} className="overflow-hidden">
                      <Skeleton className="h-64 w-full" />
                      <CardContent className="p-6">
                        <Skeleton className="h-6 w-full mb-2" />
                        <Skeleton className="h-4 w-24 mb-3" />
                        <Skeleton className="h-10 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16">
      {/* Hero Section */}
      <section className="gradient-bg py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              ✨ Produtos em <span className="text-gradient">Destaque</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Descubra nossa seleção especial de produtos organizados em coleções exclusivas
            </p>
          </div>
        </div>
      </section>

      {/* Stacks Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {!stacks || stacks.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Nenhuma coleção disponível
              </h3>
              <p className="text-muted-foreground mb-6">
                As coleções de produtos serão exibidas aqui quando disponíveis.
              </p>
              <Button onClick={handleViewAllProducts} className="btn-primary">
                Ver Todos os Produtos
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          ) : (
            <div className="space-y-16">
              {stacks.map((stack: any) => (
                <div key={stack.id} className="animate-fade-in">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                      {stack.titulo}
                    </h2>
                    <Button
                      variant="ghost"
                      onClick={handleViewAllProducts}
                      className="text-primary hover:text-primary/80 font-medium"
                    >
                      Ver todos
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>

                  {stack.produtos.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        Nenhum produto disponível nesta coleção.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {stack.produtos.map((stackProduto: any) => (
                        <ProductCard
                          key={stackProduto.id}
                          produto={stackProduto.produto}
                          onViewDetails={handleViewProduct}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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
