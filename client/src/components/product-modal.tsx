import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Heart, ShoppingCart } from "lucide-react";
import { type Produto } from "@shared/schema";

interface ProductModalProps {
  produto: Produto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductModal({ produto, open, onOpenChange }: ProductModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!produto) return null;

  const hasDiscount = produto.valorDesconto && produto.valorDesconto < produto.valorBruto;
  const discountPercent = produto.descontoCalculado;
  const images = produto.fotos.length > 0 ? produto.fotos : [
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&h=600&fit=crop"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-bold text-foreground">
              {produto.titulo}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Images */}
          <div>
            <div className="mb-4">
              <img
                src={images[selectedImageIndex]}
                alt={produto.titulo}
                className="w-full rounded-xl shadow-lg"
              />
            </div>

            {images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {images.map((foto, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImageIndex === index
                        ? "border-primary"
                        : "border-border"
                    }`}
                  >
                    <img
                      src={foto}
                      alt={`${produto.titulo} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <div className="mb-6">
              <div className="flex items-center space-x-4 mb-4">
                {hasDiscount && (
                  <Badge className="btn-coral text-white">
                    -{discountPercent}% OFF
                  </Badge>
                )}
                <Badge variant="secondary" className="text-sm">
                  COD: #{produto.id.slice(-8).toUpperCase()}
                </Badge>
              </div>

              <div className="flex items-center space-x-3 mb-4">
                <span className="text-3xl font-bold text-foreground">
                  R$ {produto.valorDesconto?.toFixed(2) || produto.valorBruto.toFixed(2)}
                </span>
                {hasDiscount && (
                  <span className="text-lg text-muted-foreground line-through">
                    R$ {produto.valorBruto.toFixed(2)}
                  </span>
                )}
              </div>

              <p className="text-muted-foreground mb-6">
                Produto premium com qualidade excepcional. Confira todos os detalhes e características especiais deste item cuidadosamente selecionado.
              </p>

              <div className="space-y-4">
                <Button
                  size="lg"
                  className="w-full btn-primary text-lg font-medium"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Adicionar ao Carrinho
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  <Heart className="h-5 w-5 mr-2" />
                  Adicionar aos Favoritos
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
