import { useState } from "react";
import { Search, ShoppingCart, Menu, X, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import AuthModal from "@/components/AuthModal";
import CartDrawer from "@/components/CartDrawer";

interface HeaderProps {
  onSearch?: (query: string) => void;
}

const Header = ({ onSearch }: HeaderProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const totalItems = useCartStore((s) => s.totalItems());
  const { isAuthenticated, user, logout } = useAuthStore();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  return (
      <>
        <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="container flex h-16 items-center gap-3 md:h-20">
            {/* Mobile menu */}
            <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Logo */}
            <a href="/" className="flex items-center gap-2 shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
                <span className="text-lg font-extrabold text-primary-foreground">P</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-lg font-extrabold text-primary">Ponto</span>
                <span className="text-lg font-extrabold text-secondary"> Fresco</span>
              </div>
            </a>

            {/* Search */}
            <form onSubmit={handleSearch} className="relative flex-1 max-w-lg mx-auto hidden md:flex">
              <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full border border-input bg-muted/50 py-2.5 pl-11 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            </form>

            {/* Actions */}
            <div className="ml-auto flex items-center gap-2">
              <button className="md:hidden p-2" onClick={() => {}}>
                <Search size={20} className="text-muted-foreground" />
              </button>

              {isAuthenticated ? (
                  <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Olá, {user?.nome?.split(" ")[0]}
                </span>
                    <Button variant="ghost" size="sm" onClick={logout}>
                      <LogOut size={16} />
                    </Button>
                  </div>
              ) : (
                  <Button
                      variant="outline"
                      size="sm"
                      className="hidden sm:inline-flex gap-1.5 border-primary/30 text-primary hover:bg-accent"
                      onClick={() => setAuthOpen(true)}
                  >
                    <User size={16} />
                    Entrar
                  </Button>
              )}

              <button
                  className="relative p-2 rounded-full hover:bg-accent transition-colors"
                  onClick={() => setCartOpen(true)}
              >
                <ShoppingCart size={22} className="text-foreground" />
                {totalItems > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[11px] font-bold text-secondary-foreground">
                  {totalItems}
                </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu panel */}
          {menuOpen && (
              <div className="border-t border-border bg-card p-4 md:hidden">
                <form onSubmit={handleSearch} className="relative mb-4">
                  <input
                      type="text"
                      placeholder="Buscar produtos..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-full border border-input bg-muted/50 py-2.5 pl-11 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                </form>
                {isAuthenticated ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Olá, {user?.nome}</span>
                      <Button variant="ghost" size="sm" onClick={logout}>
                        Sair <LogOut size={14} className="ml-1" />
                      </Button>
                    </div>
                ) : (
                    <Button className="w-full" onClick={() => { setAuthOpen(true); setMenuOpen(false); }}>
                      Entrar / Cadastrar
                    </Button>
                )}
              </div>
          )}
        </header>

        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
        <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      </>
  );
};

export default Header;