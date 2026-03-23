import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { orderService, type Order } from "@/services/orderService";

const statusMap: Record<string, { label: string; color: string }> = {
  PENDENTE: { label: "Pendente", color: "text-secondary" },
  PAGO: { label: "Pago", color: "text-primary" },
  ENVIADO: { label: "Enviado", color: "text-primary" },
  ENTREGUE: { label: "Entregue", color: "text-primary" },
  CANCELADO: { label: "Cancelado", color: "text-destructive" },
};

const OrderConfirmation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (id) {
      orderService.getById(Number(id)).then(({ data }) => setOrder(data)).catch(() => {});
    }
  }, [id]);

  const status = statusMap[order?.status || "PENDENTE"] || statusMap.PENDENTE;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-12 text-center max-w-lg mx-auto">
          <CheckCircle size={64} className="mx-auto text-primary mb-4" />
          <h1 className="text-2xl font-extrabold mb-2">Pedido Realizado!</h1>
          {order ? (
            <>
              <p className="text-muted-foreground mb-4">Pedido #{order.id}</p>
              <div className="flex items-center justify-center gap-2 mb-6">
                <Clock size={18} className={status.color} />
                <span className={`font-bold ${status.color}`}>{status.label}</span>
              </div>
              <div className="rounded-xl border border-border bg-card p-6 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold">R$ {order.total?.toFixed(2).replace(".", ",") || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Data</span>
                  <span>{order.criadoEm ? new Date(order.criadoEm).toLocaleDateString("pt-BR") : "—"}</span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">Carregando detalhes do pedido...</p>
          )}
          <Button className="mt-8" onClick={() => navigate("/")}>
            <ArrowLeft size={16} className="mr-2" /> Voltar às compras
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderConfirmation;
