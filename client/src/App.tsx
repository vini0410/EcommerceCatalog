import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CategoryStrip } from "@/components/CategoryStrip"; // Import the new component
import { FeaturedStacks } from "@/pages/featured-stacks";
import { SearchProducts } from "@/pages/search-products";
import { AdminDashboard } from "@/pages/admin-dashboard";
import { AdminLoginPage } from "@/pages/admin-login";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/context/AuthContext";

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isLoggedIn, isLoading, isLoggingOut } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl">Carregando...</div>
      </div>
    );
  }

  if (isLoggingOut) {
    return <Navigate to="/" replace />;
  }

  return isLoggedIn ? children : <Navigate to="/admin" replace />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Router>
            <div className="min-h-screen bg-background transition-colors duration-300 pt-16">
              <Header />
              <CategoryStrip /> {/* Render the new component here */}
              <Routes>
                <Route path="/" element={<FeaturedStacks />} />
                <Route path="/produtos" element={<SearchProducts />} />
                <Route path="/admin" element={<AdminLoginPage />} />
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Footer />
            </div>
            <Toaster />
          </Router>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
