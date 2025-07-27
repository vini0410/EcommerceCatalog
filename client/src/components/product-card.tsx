import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { type Produto } from "@shared/schema";

interface ProductCardProps {
  produto: Produto;
  onViewDetails: (produto: Produto) => void;
}

export function ProductCard({ produto, onViewDetails }: ProductCardProps) {
  const hasDiscount = produto.valorDesconto && produto.valorDesconto < produto.valorBruto;
  const discountPercent = produto.descontoCalculado;

  return (
    <Card 
      className="product-card group"
      onClick={() => onViewDetails(produto)}
    >
      <div className="relative overflow-hidden">
        <img
          src={produto.fotos[0] || "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop"}
          alt={produto.titulo}
          className="w-full h-48 sm:h-64 object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {hasDiscount && (
          <Badge className="absolute top-3 left-3 btn-coral text-white">
            -{discountPercent}%
          </Badge>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
          <Button
            variant="secondary"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all duration-300"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(produto);
            }}
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Detalhes
          </Button>
        </div>
      </div>

      <CardContent className="p-6">
        <h3 className="font-semibold text-card-foreground mb-2 line-clamp-2 text-base sm:text-lg">
          {produto.titulo}
        </h3>
        
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-lg font-bold text-card-foreground">
            R$ {produto.valorDesconto?.toFixed(2) || produto.valorBruto.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              R$ {produto.valorBruto.toFixed(2)}
            </span>
          )}
        </div>

        
      </CardContent>
    </Card>
  );
}
