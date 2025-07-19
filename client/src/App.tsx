import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { FeaturedStacks } from "@/pages/featured-stacks";
import { SearchProducts } from "@/pages/search-products";
import { AdminDashboard } from "@/pages/admin-dashboard";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "./context/AuthContext";

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Router>
            <AuthProvider>
              <div className="min-h-screen bg-background transition-colors duration-300">
                <Header />
                <Routes>
                  <Route path="/" element={<FeaturedStacks />} />
                  <Route path="/buscar" element={<SearchProducts />} />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
              <Toaster />
            </AuthProvider>
          </Router>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
