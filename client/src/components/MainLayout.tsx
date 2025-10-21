import React, { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CategoryStrip } from "@/components/CategoryStrip";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen bg-background transition-colors duration-300 pt-16">
      <Header />
      {/* {!isAdminRoute && <CategoryStrip />} */}
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}
