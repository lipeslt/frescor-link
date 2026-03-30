import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Package, ChevronDown, ChevronUp, RefreshCw, ShoppingBag } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { orderService, PedidoResponse, OrderItem } from "@/services/orderService";
import { paymentService, PaymentStatusResponse } from "@/services/paymentService";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// ─── Helper functions (exported for testing) ────────────────────────────────

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function getOrderStatusConfig(status: string): { label: string; classes: string } {
  switch (status) {
    case "AGUARDANDO_PAGAMENTO":
      return { label: "Aguardando pagamento", classes: "bg-amber-100 text-amber-800 border-amber-200" };
    case "PAGO":
      return { label: "Pago", classes: "bg-green-100 text-green-800 border-green-200" };
    case "SEPARACAO_ESTOQUE":
      return { label: "Em separação", classes: "bg-blue-100 text-blue-800 border-blue-200" };
    case "ENVIADO":
      return { label: "Enviado", classes: "bg-blue-100 text-blue-800 border-blue-200" };
    case "ENTREGUE":
      return { label: "Entregue", classes: "bg-green-100 text-green-800 border-green-200" };
    case "CANCELADO":
      return { label: "Cancelado", classes: "bg-red-100 text-red-800 border-red-200" };
    default:
      return { label: status, classes: "bg-gray-100 text-gray-800 border-gray-200" };
  }
}

export function getPaymentStatusConfig(status: string): { label: string; classes: string } {
  switch (status) {
    case "PENDING":
      return { label: "Aguardando pagamento", classes: "bg-amber-100 text-amber-800 border-amber-200" };
    case "APPROVED":
      return { label: "Pago", classes: "bg-green-100 text-green-800 border-green-200" };
    case "REJECTED":
      return { label: "Recusado", classes: "bg-red-100 text-red-800 border-red-200" };
    case "CANCELLED":
      return { label: "Cancelado", classes: "bg-red-100 text-red-800 border-red-200" };
    case "REFUNDED":
      return { label: "Reembolsado", classes: "bg-gray-100 text-gray-800 border-gray-200" };
    default:
      return { label: status, classes: "bg-gray-100 text-gray-800 border-gray-200" };
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrderDetail extends PedidoResponse {
  itens?: OrderItem[];
  valorTotal?: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

const Perfil = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const [orders, setOrders] = useState<PedidoResponse[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // Load orders
  const loadOrders = async () => {
    if (!user) return;
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const res = await orderService.getByUser(user.id);
      setOrders(res.data);
    } catch {
      setOrdersError("Não foi possível carregar seus pedidos. Tente novamente.");
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      loadOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  // Load order detail + payment status
  const handleSelectOrder = async (orderId: string) => {
    if (selectedOrderId === orderId) {
      setSelectedOrderId(null);
      setOrderDetail(null);
      setPaymentStatus(null);
      setDetailError(null);
      return;
    }

    setSelectedOrderId(orderId);
    setDetailLoading(true);
    setDetailError(null);
    setOrderDetail(null);
    setPaymentStatus(null);

    try {
      const [detailRes, paymentRes] = await Promise.allSettled([
        orderService.getById(orderId),
        paymentService.getPaymentStatus(orderId),
      ]);

      if (detailRes.status === "fulfilled") {
        setOrderDetail(detailRes.value.data);
      } else {
        setDetailError("Não foi possível carregar os detalhes deste pedido.");
      }

      if (paymentRes.status === "fulfilled") {
        setPaymentStatus(paymentRes.value.data);
      }
      // payment failure is silent — badge is omitted
    } finally {
      setDetailLoading(false);
    }
  };

  if (!isAuthenticated || !user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="container flex-1 py-8 max-w-3xl mx-auto">
        {/* User info card */}
        <div className="mb-8 flex items-center gap-4 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <User size={28} className="text-primary" />
          </div>
          <div>
            <p className="text-lg font-semibold">{user.nome}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        {/* Orders section */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
            <Package size={20} />
            Meus Pedidos
          </h2>

          {/* Loading skeletons */}
          {ordersLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          )}

          {/* Error state */}
          {!ordersLoading && ordersError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
              <p className="mb-4 text-sm text-destructive">{ordersError}</p>
              <Button variant="outline" size="sm" onClick={loadOrders}>
                <RefreshCw size={14} className="mr-2" />
                Tentar novamente
              </Button>
            </div>
          )}

          {/* Empty state */}
          {!ordersLoading && !ordersError && orders.length === 0 && (
            <div className="rounded-xl border border-border bg-muted/30 p-10 text-center">
              <ShoppingBag size={40} className="mx-auto mb-3 text-muted-foreground" />
              <p className="mb-4 text-muted-foreground">Você ainda não fez nenhum pedido.</p>
              <Button onClick={() => navigate("/")}>Explorar produtos</Button>
            </div>
          )}

          {/* Orders list */}
          {!ordersLoading && !ordersError && orders.length > 0 && (
            <div className="space-y-3">
              {orders.map((order) => {
                const statusCfg = getOrderStatusConfig(order.status);
                const isSelected = selectedOrderId === order.id;
                const dateStr = order.dataPedido ?? order.createdAt;

                return (
                  <div
                    key={order.id}
                    className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
                  >
                    {/* Order row */}
                    <button
                      className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-muted/40 transition-colors"
                      onClick={() => handleSelectOrder(order.id)}
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold">
                          Pedido #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(dateStr)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {order.valorTotal != null && (
                          <span className="text-sm font-medium">
                            {formatCurrency(order.valorTotal)}
                          </span>
                        )}
                        <Badge className={statusCfg.classes} variant="outline">
                          {statusCfg.label}
                        </Badge>
                        {isSelected ? (
                          <ChevronUp size={16} className="text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronDown size={16} className="text-muted-foreground shrink-0" />
                        )}
                      </div>
                    </button>

                    {/* Inline detail */}
                    {isSelected && (
                      <div className="border-t border-border bg-muted/20 p-4">
                        {detailLoading && (
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-2/3" />
                          </div>
                        )}

                        {!detailLoading && detailError && (
                          <p className="text-sm text-destructive">{detailError}</p>
                        )}

                        {!detailLoading && !detailError && orderDetail && (
                          <div className="space-y-4">
                            {/* Payment status badge */}
                            {paymentStatus && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Pagamento:</span>
                                <Badge
                                  className={getPaymentStatusConfig(paymentStatus.status).classes}
                                  variant="outline"
                                >
                                  {getPaymentStatusConfig(paymentStatus.status).label}
                                </Badge>
                              </div>
                            )}

                            {/* Items list */}
                            {orderDetail.itens && orderDetail.itens.length > 0 ? (
                              <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                  Itens
                                </p>
                                <ul className="space-y-2">
                                  {orderDetail.itens.map((item) => (
                                    <li
                                      key={item.id}
                                      className="flex items-center justify-between text-sm"
                                    >
                                      <span className="flex-1">{item.nomeProduto}</span>
                                      <span className="mx-4 text-muted-foreground">
                                        x{item.quantidade}
                                      </span>
                                      <span className="font-medium">
                                        {formatCurrency(item.precoUnitario)}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                Nenhum item encontrado.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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

export default Perfil;
