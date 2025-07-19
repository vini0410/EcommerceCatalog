import { Route, Routes } from 'react-router-dom';
import { Header } from './components/header';
import { AdminRoute } from './components/admin-route';

// Import actual page components
import { FeaturedStacks } from './pages/featured-stacks';
import { SearchProducts } from './pages/search-products';
import { AdminDashboard } from './pages/admin-dashboard';
import NotFound from './pages/not-found';

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto p-4">
        <Routes>
          <Route path="/" element={<FeaturedStacks />} />
          <Route path="/search" element={<SearchProducts />} />
          
          {/* Rota de Admin Protegida */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            {/* Outras rotas de admin podem ser adicionadas aqui */}
          </Route>
          <Route path="*" element={<NotFound />} /> {/* Catch-all for 404 */}
        </Routes>
      </main>
    </div>
  );
}

export default App;