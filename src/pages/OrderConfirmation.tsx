import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, Clock, ArrowLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { orderService, type PedidoResponse } from "@/services/orderService";
import { useCartStore } from "@/stores/cartStore";

const statusMap: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDENTE: { label: "Pendente", color: "text-secondary", icon: Clock },
  PAGO: { label: "Pago", color: "text-primary", icon: CheckCircle },
  ENVIADO: { label: "Enviado", color: "text-primary", icon: Package },
  ENTREGUE: { label: "Entregue", color: "text-primary", icon: CheckCircle },
  CANCELADO: { label: "Cancelado", color: "text-destructive", icon: Clock },
};

const OrderConfirmation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<PedidoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { items } = useCartStore();

  useEffect(() => {
    if (!id) return;

    orderService
        .getById(Number(id))
        .then(({ data }) => setOrder(data))
        .catch(() => setError(true))
        .finally(() => setLoading(false));
  }, [id]);

  const status = statusMap[order?.status || "PENDENTE"] || statusMap.PENDENTE;
  const StatusIcon = status.icon;

  // Data formatada — usa createdAt ou dataPedido
  const dataFormatada = (() => {
    const raw = order?.createdAt || order?.dataPedido;
    if (!raw) return "—";
    try {
      return new Date(raw).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  })();

  return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="container py-12 text-center max-w-lg mx-auto">
            {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-16 w-16 rounded-full bg-muted mx-auto" />
                  <div className="h-6 bg-muted rounded w-48 mx-auto" />
                  <div className="h-4 bg-muted rounded w-32 mx-auto" />
                </div>
            ) : error ? (
                <>
                  <Package size={64} className="mx-auto text-muted-foreground/40 mb-4" />
                  <h1 className="text-2xl font-extrabold mb-2">Pedido não encontrado</h1>
                  <p className="text-muted-foreground mb-6">
                    Não conseguimos localizar o pedido #{id}.
                  </p>
                  <Button onClick={() => navigate("/")}>Voltar às compras</Button>
                </>
            ) : (
                <>
                  <CheckCircle size={64} className="mx-auto text-primary mb-4" />
                  <h1 className="text-2xl font-extrabold mb-2">Pedido Realizado!</h1>
                  <p className="text-muted-foreground mb-4">
                    Pedido #{order?.id} registrado com sucesso.
                  </p>

                  {/* Status */}
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <StatusIcon size={18} className={status.color} />
                    <span className={`font-bold ${status.color}`}>{status.label}</span>
                  </div>

                  {/* Detalhes */}
                  <div className="rounded-xl border border-border bg-card p-6 text-left space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pedido</span>
                      <span className="font-bold">#{order?.id}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Cliente</span>
                      <span>{order?.usuario?.nome || "—"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Data</span>
                      <span>{dataFormatada}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <span className={`font-semibold ${status.color}`}>{status.label}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-8">
                    <Button variant="outline" className="flex-1" onClick={() => navigate("/meus-pedidos")}>
                      Meus Pedidos
                    </Button>
                    <Button className="flex-1" onClick={() => navigate("/")}>
                      <ArrowLeft size={16} className="mr-2" /> Continuar comprando
                    </Button>
                  </div>
                </>
            )}
          </div>
        </main>
        <Footer />
      </div>
  );
};

export default OrderConfirmation;