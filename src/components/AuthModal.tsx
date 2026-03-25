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

        login(usuario, data.token, data.refreshToken);
        toast({ title: "Bem-vindo de volta!", description: `Olá, ${usuario.nome}` });
        onClose();
      } else {
        await authService.register({
          nome: form.nome,
          email: form.email,
          senha: form.senha,
        });
        toast({ title: "Conta criada!", description: "Agora faça login." });
        setMode("login");
        setForm({ nome: "", email: "", senha: "" });
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
                <>
                  <input
                      type="text"
                      placeholder="Seu nome"
                      required
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      className="w-full rounded-lg border border-input bg-muted/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <p className="text-xs text-muted-foreground">
                    A senha deve ter pelo menos 8 caracteres, com maiúsculas, minúsculas, números e um caractere especial (!@#$...).
                  </p>
                </>
            )}
            <input
                type="email"
                placeholder="E-mail"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-input bg-muted/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <input
                type="password"
                placeholder="Senha"
                required
                value={form.senha}
                onChange={(e) => setForm({ ...form, senha: e.target.value })}
                className="w-full rounded-lg border border-input bg-muted/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Button type="submit" className="w-full py-3 font-semibold" disabled={loading}>
              {loading ? "Carregando..." : mode === "login" ? "Entrar" : "Cadastrar"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            {mode === "login" ? "Não tem conta? " : "Já tem conta? "}
            <button
                className="font-semibold text-primary hover:underline"
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setForm({ nome: "", email: "", senha: "" });
                }}
            >
              {mode === "login" ? "Cadastre-se" : "Fazer login"}
            </button>
          </p>
        </DialogContent>
      </Dialog>
  );
};

export default AuthModal;