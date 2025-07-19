import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { AdminLoginModal } from '@/components/admin-login-modal';
import { LogOut, UserCog } from 'lucide-react';

export function Header() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isAdmin, logout } = useAdmin();
  const navigate = useNavigate();

  const handleAdminClick = () => {
    if (isAdmin) {
      navigate('/admin');
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <a href="/" className="flex items-center space-x-2">
            <span className="font-bold">Meu Catálogo</span>
          </a>
          <div className="flex items-center space-x-2">
            {isAdmin && (
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleAdminClick}>
              <UserCog className="mr-2 h-4 w-4" />
              Admin
            </Button>
          </div>
        </div>
      </header>
      <AdminLoginModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}