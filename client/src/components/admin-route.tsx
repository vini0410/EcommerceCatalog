import { useAdmin } from '@/hooks/use-admin';
import { Navigate, Outlet } from 'react-router-dom';

export function AdminRoute() {
  const { isAdmin } = useAdmin();

  if (!isAdmin) {
    // Se não for admin, redireciona para a home.
    // O modal de login será aberto pelo Header se o usuário tentar acessar novamente.
    return <Navigate to="/" replace />;
  }

  // Se for admin, renderiza o conteúdo da rota (ex: o painel de admin)
  return <Outlet />;
}