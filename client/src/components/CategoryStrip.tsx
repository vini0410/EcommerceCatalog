
import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { type Categoria } from '@shared/schema';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function CategoryStrip() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto'; // Clean up on unmount
    };
  }, [isOpen]);

  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery<Categoria[]>({
    queryKey: ["/api/categorias"],
    queryFn: () => api.getCategorias(),
    staleTime: Infinity,
  });

  const getContrastColor = (hexColor: string) => {
    if (!hexColor) return '#ffffff';
    const cleanHex = hexColor.startsWith('#') ? hexColor.slice(1) : hexColor;
    if (cleanHex.length !== 6) return '#ffffff';
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
    return luminance > 186 ? '#000000' : '#ffffff';
  };

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/produtos?categoryIds=${categoryId}`);
    setIsOpen(false); // Close the strip after clicking a category
  };

  const handleWheelScroll = (event: React.WheelEvent<HTMLDivElement>) => {
    if (scrollRef.current) {
      event.preventDefault();
      event.stopPropagation();
      scrollRef.current.scrollLeft += event.deltaY;
    }
  };

  return (
    <div className="fixed top-16 left-0 right-0 z-30 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-start mt-2 relative h-[56px] w-full">
          <Button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-full px-6 py-2 text-sm font-medium shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 absolute top-[-10px]"
          >
            Categorias {isOpen ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </div>

      {isOpen && (
        <div
          ref={scrollRef}
          onWheel={handleWheelScroll}
          className="bg-card border-t border-b border-border shadow-md py-4 mt-2 overflow-x-auto whitespace-nowrap scrollbar-hide"
        >
          {isLoadingCategories ? (
            <div className="flex justify-start gap-4 px-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-8 w-24 bg-muted rounded-full animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="flex justify-start gap-4 px-6">
              {categoriesData?.map((category) => {
                const color = category.color || '#818cf8';
                const textColor = getContrastColor(color);

                const style: React.CSSProperties = {
                  backgroundColor: color,
                  color: textColor,
                  transition: 'all 0.2s ease-in-out',
                  borderWidth: '2px',
                  borderColor: color,
                };

                return (
                  <Button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className="rounded-full px-4 py-1.5 text-sm font-semibold transform hover:scale-105 hover:shadow-lg"
                    style={style}
                  >
                    {category.titulo}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper to hide scrollbar for horizontal overflow
// You might need to add this to your global CSS or a utility file
/*
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;  // IE and Edge
    scrollbar-width: none;  // Firefox
}
*/
