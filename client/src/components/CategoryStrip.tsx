
import React, { useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { type Categoria } from '@shared/schema';

export function CategoryStrip() {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleWheelScroll = (event: WheelEvent) => {
    if (scrollRef.current) {
      event.preventDefault();
      scrollRef.current.scrollLeft += event.deltaY;
    }
  };

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    scrollElement.addEventListener('wheel', handleWheelScroll, { passive: false });

    return () => {
      scrollElement.removeEventListener('wheel', handleWheelScroll);
    };
  }, []);

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
  };

  return (
    <div className="bg-card shadow-md py-4 overflow-x-auto whitespace-nowrap" ref={scrollRef}>
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
