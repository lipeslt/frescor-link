import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { orderService } from "@/services/orderService";
import { toast } from "@/hooks/use-toast";

const Checkout = () => {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFinalize = async () => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Faça login",
        description: "Você precisa estar logado para finalizar o pedido.",
        variant: "destructive",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos ao carrinho antes de finalizar.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Cria o pedido no backend com status PENDENTE
      const { data: order } = await orderService.create({
        usuarioId: user.id,
        status: "PENDENTE",
      });

      clearCart();
      toast({
        title: "Pedido criado com sucesso!",
        description: `Pedido #${order.id} registrado.`,
      });
      navigate(`/pedido/${order.id}`);
    } catch (err: any) {
      const msg =
          err?.response?.data?.mensagem ||
          err?.response?.data?.message ||
          "Erro ao criar pedido. Tente novamente.";
      toast({
        title: "Erro ao finalizar",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="container py-8">
            <button
                onClick={() => navigate(-1)}
                className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={16} /> Voltar
            </button>
            <h1 className="text-2xl font-extrabold md:text-3xl mb-6">Resumo do Pedido</h1>

            {items.length === 0 ? (
                <div className="text-center py-20">
                  <ShoppingBag size={48} className="mx-auto text-muted-foreground/40 mb-4" />
                  <p className="text-muted-foreground text-lg">Seu carrinho está vazio.</p>
                  <Button className="mt-4" onClick={() => navigate("/")}>
                    Continuar Comprando
                  </Button>
                </div>
            ) : (
                <div className="grid gap-8 lg:grid-cols-3">
                  {/* Lista de itens */}
                  <div className="lg:col-span-2 space-y-3">
                    {items.map((item) => (
                        <div
                            key={item.product.id}
                            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
                        >
                          <div className="h-16 w-16 rounded-lg bg-muted shrink-0 overflow-hidden">
                            {item.product.imagemUrl ? (
                                <img
                                    src={item.product.imagemUrl}
                                    alt={item.product.nome}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="h-full w-full bg-muted flex items-center justify-center">
                                  <ShoppingBag size={24} className="text-muted-foreground/40" />
                                </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{item.product.nome}</p>
                            <p className="text-sm text-primary font-bold">
                              R$ {item.product.preco.toFixed(2).replace(".", ",")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                                className="rounded-md border border-border p-1.5 hover:bg-muted"
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                            <button
                                className="rounded-md border border-border p-1.5 hover:bg-muted"
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <p className="font-bold shrink-0 w-24 text-right">
                            R$ {(item.product.preco * item.quantity).toFixed(2).replace(".", ",")}
                          </p>
                          <button
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => removeItem(item.product.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                    ))}
                  </div>

                  {/* Resumo do pedido */}
                  <div className="rounded-xl border border-border bg-card p-6 h-fit sticky top-24">
                    <h3 className="text-lg font-bold mb-4">Resumo</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} itens)
                    </span>
                        <span>R$ {totalPrice().toFixed(2).replace(".", ",")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Entrega</span>
                        <span className="text-primary font-semibold">Grátis</span>
                      </div>
                    </div>
                    <div className="mt-4 border-t border-border pt-4 flex justify-between text-xl font-extrabold">
                      <span>Total</span>
                      <span className="text-primary">R$ {totalPrice().toFixed(2).replace(".", ",")}</span>
                    </div>

                    {!isAuthenticated && (
                        <p className="mt-3 text-xs text-center text-muted-foreground">
                          Você precisará fazer login para finalizar o pedido.
                        </p>
                    )}

                    <Button
                        className="w-full mt-6 py-3 font-bold"
                        disabled={loading}
                        onClick={handleFinalize}
                    >
                      {loading ? "Processando..." : "Finalizar Pedido"}
                    </Button>
                  </div>
                </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
  );
};

export default Checkout;