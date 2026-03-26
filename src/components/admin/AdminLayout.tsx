import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Tag, Package, Users, ShoppingCart, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/categorias", label: "Categorias", icon: Tag },
  { to: "/admin/produtos", label: "Produtos", icon: Package },
  { to: "/admin/usuarios", label: "Usuários", icon: Users },
  { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
];

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="offcanvas">
          <div className="p-4 font-semibold text-lg border-b">Admin</div>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map(({ to, label, icon: Icon }) => (
                <SidebarMenuItem key={to}>
                  <NavLink to={to}>
                    {({ isActive }) => (
                      <SidebarMenuButton isActive={isActive}>
                        <Icon />
                        <span>{label}</span>
                      </SidebarMenuButton>
                    )}
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <div className="flex flex-1 flex-col">
          <header className="flex items-center justify-between border-b px-4 py-3">
            <SidebarTrigger />
            <div className="flex items-center gap-4">
              <div className="text-sm text-right">
                <p className="font-medium">{user?.nome}</p>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </header>

          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
