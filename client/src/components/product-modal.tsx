import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, MessageCircle, Phone } from "lucide-react"; // Import ImageIcon, MessageCircle, and Phone
import { type Produto } from "@shared/schema";
import { capitalize } from "@/lib/utils";

interface ProductModalProps {
  produto: Produto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductModal({ produto, open, onOpenChange }: ProductModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!produto) return null;

  const hasDiscount =
    produto.valorDesconto && produto.valorDesconto < produto.valorBruto;
  const discountPercent = produto.descontoCalculado;
  const hasImages = produto.fotos && produto.fotos.length > 0;
  const images = hasImages ? produto.fotos : [];

  const storePhoneNumber = "5548996551074"; // Replace with your store's number
  const defaultMessage = `Olá, tenho interesse no produto: *${produto.titulo}* \nValor: R$ ${produto.valorDesconto?.toFixed(2) || produto.valorBruto.toFixed(2)} \nCodigo do Produto: ${produto.id}`;
  const encodedMessage = encodeURIComponent(defaultMessage);

  const whatsappWebAppUrl = `https://web.whatsapp.com/send?phone=${storePhoneNumber}&text=${encodedMessage}`;
  const whatsappAppUrl = `https://wa.me/${storePhoneNumber}?text=${encodedMessage}`;

  const isMobileOrTablet = () => {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth < 768; // Example breakpoint for small screens

    return hasTouch || isSmallScreen;
  };

  const whatsappRedirectUrl = isMobileOrTablet() ? whatsappAppUrl : whatsappWebAppUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-foreground">
            {capitalize(produto.titulo)}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Product Images */}
          <div className="md:w-1/2">
            <div className="aspect-square bg-secondary flex items-center justify-center rounded-xl shadow-lg mb-4">
              {hasImages ? (
                <img
                  src={images[selectedImageIndex]}
                  alt={produto.titulo}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <ImageIcon className="w-24 h-24 text-muted-foreground" />
              )}
            </div>

            {hasImages && images.length > 1 && (
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
            <div className="mb-6">
              {hasDiscount && (
                <div className="flex items-center justify-center md:justify-start space-x-4 mb-4">
                    <Badge className="btn-coral text-white">
                      -{discountPercent}% OFF
                    </Badge>
                </div>
              )}

              <div className="flex items-center justify-center md:justify-start space-x-3 mb-4">
                <span className="text-2xl sm:text-3xl font-bold text-foreground">
                  R${" "}
                  {produto.valorDesconto?.toFixed(2) ||
                    produto.valorBruto.toFixed(2)}
                </span>
                {hasDiscount && (
                  <span className="text-lg text-muted-foreground line-through">
                    R$ {produto.valorBruto.toFixed(2)}
                  </span>
                )}
              </div>

              <p className="text-muted-foreground mb-6 whitespace-pre-wrap">
                {capitalize(produto.descricao) ||
                  "Nenhuma descrição disponível para este produto."}
              </p>
            </div>
          </div>
        </div>

        {/* WhatsApp Button */}
        <a
          href={whatsappRedirectUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-8 right-8 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-colors"
          aria-label="Contact via WhatsApp"
        >
          <MessageCircle className="w-8 h-8" />
        </a>
      </DialogContent>
    </Dialog>
  );
}