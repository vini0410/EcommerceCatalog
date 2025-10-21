import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { MainLayout } from "@/components/MainLayout";
import { MaintenanceProvider, useMaintenance } from "./context/MaintenanceContext";
import MaintenancePage from "./pages/maintenance";
import { AdminLoginPage } from "./pages/admin-login";
import { AdminDashboard } from "./pages/admin-dashboard";
import { FeaturedStacks } from "./pages/featured-stacks";
import { SearchProducts } from "./pages/search-products";
import NotFound from "./pages/not-found";
import { useAuth } from "./context/AuthContext";

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

const AppRoutes = () => {
  const { maintenanceMode, isLoading } = useMaintenance();
  const location = useLocation();

  // if (isLoading) {
  //   return <div className="flex items-center justify-center min-h-screen">Carregando...</div>; // Or a spinner
  // }

  return (
    <MainLayout>
      {maintenanceMode && !location.pathname.startsWith("/admin") ? (
        <MaintenancePage />
      ) : (
        <Routes>
          <Route path="/admin" element={<AdminLoginPage />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<FeaturedStacks />} />
          <Route path="/produtos" element={<SearchProducts />} />
          <Route path="/search" element={<SearchProducts />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      )}
    </MainLayout>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Router>
            <MaintenanceProvider>
              <AppRoutes />
            </MaintenanceProvider>
            <Toaster />
          </Router>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
