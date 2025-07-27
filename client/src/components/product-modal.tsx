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
      <DialogContent className="max-w-md sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl sm:text-2xl font-bold text-foreground">
              {produto.titulo}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Product Images */}
          <div className="md:w-1/2">
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
          <div className="md:w-1/2 text-center md:text-left">
            <DialogTitle className="text-2xl font-bold text-foreground mb-4">
              {produto.titulo}
            </DialogTitle>
            <div className="mb-6">
              <div className="flex items-center justify-center md:justify-start space-x-4 mb-4">
                {hasDiscount && (
                  <Badge className="btn-coral text-white">
                    -{discountPercent}% OFF
                  </Badge>
                )}
                <Badge variant="secondary" className="text-sm">
                  COD: #{produto.id.slice(-8).toUpperCase()}
                </Badge>
              </div>

              <div className="flex items-center justify-center md:justify-start space-x-3 mb-4">
                <span className="text-2xl sm:text-3xl font-bold text-foreground">
                  R$ {produto.valorDesconto?.toFixed(2) || produto.valorBruto.toFixed(2)}
                </span>
                {hasDiscount && (
                  <span className="text-lg text-muted-foreground line-through">
                    R$ {produto.valorBruto.toFixed(2)}
                  </span>
                )}
              </div>

              <p className="text-muted-foreground mb-6">
                {produto.descricao || "Nenhuma descrição disponível para este produto."}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
