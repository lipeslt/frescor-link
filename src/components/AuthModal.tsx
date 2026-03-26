import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/services/authService";
import { toast } from "@/hooks/use-toast";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

const AuthModal = ({ open, onClose }: AuthModalProps) => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", senha: "" });
  const login = useAuthStore((s) => s.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { data } = await authService.login({
          email: form.email,
          senha: form.senha,
        });

        const usuario = authService.decodeToken(data.token);
        if (!usuario) {
          throw new Error("Não foi possível decodificar o token");
        }

        login(usuario, data.token, data.token);
        toast({
          title: "Bem-vindo de volta!",
          description: `Olá, ${usuario.nome}`
        });

        setForm({ nome: "", email: "", senha: "" });
        onClose();
      } else {
        const { data } = await authService.register({
          nome: form.nome,
          email: form.email,
          senha: form.senha,
        });

        const usuario = authService.decodeToken(data.token);
        if (!usuario) {
          throw new Error("Não foi possível decodificar o token");
        }

        login(usuario, data.token, data.token);
        toast({
          title: "Conta criada!",
          description: "Você já está logado!"
        });

        setForm({ nome: "", email: "", senha: "" });
        onClose();
      }
    } catch (err: any) {
      const status = err?.response?.status;
      let msg = "Erro ao processar. Tente novamente.";

      if (status === 401) {
        msg = "Email ou senha inválidos.";
      } else if (status === 409) {
        msg = "Email já cadastrado.";
      } else if (status === 423) {
        msg = "Conta bloqueada temporariamente. Tente novamente em alguns minutos.";
      } else if (status === 400) {
        const backendMsg = err?.response?.data?.mensagem || err?.response?.data?.message;
        msg = backendMsg || "Dados inválidos. Verifique os campos.";
      } else if (err?.response?.data?.erro) {
        msg = err.response.data.mensagem || err.response.data.erro;
      } else if (err.message) {
        msg = err.message;
      }

      toast({ title: "Erro", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold">
              {mode === "login" ? "Entrar na sua conta" : "Criar uma conta"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {mode === "register" && (
                <input
                    type="text"
                    placeholder="Nome completo"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2"
                    required
                />
            )}
            <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2"
                required
            />
            <input
                type="password"
                placeholder="Senha"
                value={form.senha}
                onChange={(e) => setForm({ ...form, senha: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2"
                required
            />
            <Button
                type="submit"
                className="w-full"
                disabled={loading}
            >
              {loading ? "Carregando..." : mode === "login" ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <div className="text-center text-sm">
            <button
                type="button"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="text-primary hover:underline"
            >
              {mode === "login" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entre"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
  );
};

export default AuthModal;