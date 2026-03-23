import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuthStore } from "@/stores/authStore";
import { orderService, type Order } from "@/services/orderService";

const statusColors: Record<string, string> = {
  PENDENTE: "bg-offer-orange-light text-offer-orange-dark",
  PAGO: "bg-fresh-green-light text-fresh-green-dark",
  ENVIADO: "bg-accent text-accent-foreground",
  ENTREGUE: "bg-fresh-green-light text-fresh-green-dark",
  CANCELADO: "bg-destructive/10 text-destructive",
};

const MyOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) return;
    orderService.getAll()
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : (data as any)?.content || [];
        setOrders(list.filter((o: Order) => o.usuarioId === user?.id));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated, user?.id]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground text-lg mb-4">Faça login para ver seus pedidos.</p>
            <Button onClick={() => navigate("/")}>Voltar</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          <button onClick={() => navigate("/")} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> Voltar
          </button>
          <h1 className="text-2xl font-extrabold md:text-3xl mb-6">Meus Pedidos</h1>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20">
              <Package size={48} className="mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">Você ainda não fez nenhum pedido.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => navigate(`/pedido/${order.id}`)}
                  className="w-full flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow text-left"
                >
                  <div>
                    <p className="font-bold">Pedido #{order.id}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock size={14} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {order.criadoEm ? new Date(order.criadoEm).toLocaleDateString("pt-BR") : "—"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${statusColors[order.status] || "bg-muted text-muted-foreground"}`}>
                      {order.status}
                    </span>
                    <p className="mt-1 font-bold text-primary">
                      R$ {order.total?.toFixed(2).replace(".", ",") || "—"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyOrders;
