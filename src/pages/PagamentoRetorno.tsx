import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const statusConfig = {
  approved: {
    icon: CheckCircle,
    title: "Pagamento aprovado!",
    description: "Seu pedido foi confirmado e está sendo preparado.",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  failure: {
    icon: XCircle,
    title: "Pagamento recusado",
    description: "Não foi possível processar seu pagamento. Tente novamente.",
    color: "text-red-600",
    bg: "bg-red-50",
  },
  pending: {
    icon: Clock,
    title: "Pagamento pendente",
    description: "Seu pagamento está sendo processado. Você receberá uma confirmação em breve.",
    color: "text-yellow-600",
    bg: "bg-yellow-50",
  },
};

export default function PagamentoRetorno() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const status = params.get("collection_status") ?? "pending";
  const config = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.pending;
  const Icon = config.icon;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <div className={`rounded-2xl border p-10 text-center max-w-md w-full mx-4 ${config.bg}`}>
          <Icon size={56} className={`mx-auto mb-4 ${config.color}`} />
          <h1 className={`text-2xl font-extrabold mb-2 ${config.color}`}>{config.title}</h1>
          <p className="text-muted-foreground mb-6">{config.description}</p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate("/")}>Voltar para a loja</Button>
            {status !== "approved" && (
              <Button variant="outline" onClick={() => navigate("/checkout")}>
                Tentar novamente
              </Button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
