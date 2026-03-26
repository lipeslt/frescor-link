import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";

const AdminGuard = () => {
  const { isAuthenticated, isAdmin } = useAuthStore();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta área.",
        variant: "destructive",
      });
    }
  }, [isAuthenticated, isAdmin, toast]);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminGuard;
