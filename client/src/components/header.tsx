import { useState, useEffect } from "react"; // Import useEffect
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sun, Moon, Settings, Menu, LogOut, Sparkles } from "lucide-react"; // Import Sparkles
import { AdminLoginModal } from "./admin-login-modal";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isLoggedIn, logout, checkAuth } = useAuth();
  const { locale, setLocale } = useLocale();

  const [isSmallScreen, setIsSmallScreen] = useState(false); // New state for screen size

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768); // Breakpoint at 768px (md in Tailwind)
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Call once on mount to set initial state

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const localeDisplay = {
    'pt-BR': { flag: "🇧🇷", label: "PT-BR" },
    'en-US': { flag: "🇺🇸", label: "EN-US" },
  };

  const navigation = [
    { href: "/", label: "🌟 Destaques", id: "destaques" },
    { href: "/produtos", label: "❤️ Nossos produtos", id: "busca" },
    ...(isLoggedIn ? [{ href: "/admin", label: "⚙️ Gestão", id: "gestao" }] : []),
  ];

  const isActive = (href: string) => {
    if (href === "/" && location.pathname === "/") return true;
    if (href !== "/" && location.pathname.startsWith(href)) return true;
    return false;
  };

  const handleAdminClick = () => {
    if (isLoggedIn) {
      navigate("/admin");
    } else {
      setShowAdminModal(true);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <>
      <header className="bg-card/95 backdrop-blur-sm shadow-lg fixed top-0 left-0 right-0 z-40 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <div className="btn-primary rounded-full flex items-center justify-center px-2 py-1">
                {isSmallScreen ? ( // Conditional rendering based on screen size
                  <span className="text-primary-foreground font-bold text-lg">E.C <Sparkles className="inline-block w-4 h-4" /></span>
                ) : (
                  <span className="text-primary-foreground font-bold text-lg">Elegância Cintilante ✨</span>
                )}
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Controls */}
            <div className="flex items-center space-x-2">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-lg"
                title="Alternar tema"
              >
                {theme === "light" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>

              {/* Locale Switcher Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-lg text-lg">
                    {localeDisplay[locale].flag}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-0">
                  <DropdownMenuItem onSelect={() => setLocale('pt-BR')}>
                    <span className="mr-2">🇧🇷</span> PT-BR
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setLocale('en-US')}>
                    <span className="mr-2">🇺🇸</span> EN-US
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Admin/Logout Button */}
              {isLoggedIn ? (
                <Button
                  onClick={handleLogout}
                  className="btn-primary px-4 py-2 text-sm font-medium rounded-lg"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              ) : (
                <Button
                  onClick={handleAdminClick}
                  className="btn-primary px-4 py-2 text-sm font-medium rounded-lg"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              )}

              {/* Mobile menu button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <nav className="flex flex-col space-y-4 mt-8">
                    {navigation.map((item) => (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`px-3 py-2 rounded-md text-base font-medium transition-colors ${
                          isActive(item.href)
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-primary"
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <AdminLoginModal 
        open={showAdminModal} 
        onOpenChange={setShowAdminModal} 
        onLoginSuccess={async () => {
          setShowAdminModal(false);
          await checkAuth();
          navigate("/admin");
        }}
      />
    </>
  );
}
