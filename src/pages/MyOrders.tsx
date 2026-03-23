import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, ArrowLeft, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuthStore } from "@/stores/authStore";
import { orderService, type PedidoResponse } from "@/services/orderService";

const statusConfig: Record<string, { label: string; classes: string }> = {
    PENDENTE: { label: "Pendente", classes: "bg-yellow-100 text-yellow-800" },
    PAGO: { label: "Pago", classes: "bg-green-100 text-green-800" },
    ENVIADO: { label: "Enviado", classes: "bg-blue-100 text-blue-800" },
    ENTREGUE: { label: "Entregue", classes: "bg-green-100 text-green-800" },
    CANCELADO: { label: "Cancelado", classes: "bg-red-100 text-red-800" },
};

const MyOrders = () => {
    const [orders, setOrders] = useState<PedidoResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const { isAuthenticated, user } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated || !user) return;

        orderService
            .getAll()
            .then(({ data }) => {
                // Filtra apenas os pedidos do usuário logado
                const content = Array.isArray(data) ? data : (data as any)?.content || [];
                const meusPedidos = content.filter(
                    (o: PedidoResponse) => o.usuario?.id === user.id
                );
                setOrders(meusPedidos);
            })
            .catch(() => setOrders([]))
            .finally(() => setLoading(false));
    }, [isAuthenticated, user]);

    if (!isAuthenticated) {
        return (
            <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Package size={48} className="mx-auto text-muted-foreground/40 mb-4" />
                        <p className="text-muted-foreground text-lg mb-4">
                            Faça login para ver seus pedidos.
                        </p>
                        <Button onClick={() => navigate("/")}>Voltar</Button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const formatDate = (raw?: string) => {
        if (!raw) return "—";
        try {
            return new Date(raw).toLocaleDateString("pt-BR");
        } catch {
            return "—";
        }
    };

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
                <div className="container py-8">
                    <button
                        onClick={() => navigate("/")}
                        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft size={16} /> Voltar
                    </button>
                    <h1 className="text-2xl font-extrabold md:text-3xl mb-6">Meus Pedidos</h1>

                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
                            ))}
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-20">
                            <Package size={48} className="mx-auto text-muted-foreground/40 mb-4" />
                            <p className="text-muted-foreground mb-4">Você ainda não fez nenhum pedido.</p>
                            <Button onClick={() => navigate("/")}>Explorar produtos</Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {orders.map((order) => {
                                const sc = statusConfig[order.status] || {
                                    label: order.status,
                                    classes: "bg-muted text-muted-foreground",
                                };
                                return (
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
                          {formatDate(order.createdAt || order.dataPedido)}
                        </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                      <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${sc.classes}`}
                      >
                        {sc.label}
                      </span>
                                            <ChevronRight size={16} className="text-muted-foreground" />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default MyOrders;