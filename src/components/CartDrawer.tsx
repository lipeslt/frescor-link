import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CartDrawerProps {
    open: boolean;
    onClose: () => void;
}

const CartDrawer = ({ open, onClose }: CartDrawerProps) => {
    const navigate = useNavigate();
    const { items, totalPrice, removeItem, clearCart } = useCartStore();
    const { isAuthenticated } = useAuthStore();

    const handleCheckout = () => {
        if (!isAuthenticated) {
            alert("Você precisa estar logado para fazer compras!");
            return;
        }
        onClose();
        navigate("/checkout");
    };

    return (
        <Drawer open={open} onOpenChange={onClose}>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>Carrinho de Compras ({items.length})</DrawerTitle>
                </DrawerHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {items.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">Carrinho vazio</p>
                    ) : (
                        items.map((item) => (
                            <div key={item.product.id} className="flex justify-between items-center border-b pb-4">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-sm">{item.product.nome}</h4>
                                    <p className="text-xs text-muted-foreground">
                                        {item.quantity}x R$ {item.product.preco.toFixed(2).replace(".", ",")}
                                    </p>
                                </div>
                                <button
                                    onClick={() => removeItem(item.product.id)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <DrawerFooter className="border-t pt-4">
                    <div className="text-right mb-4">
                        <p className="text-sm text-muted-foreground">Total:</p>
                        <p className="text-2xl font-bold text-primary">
                            R$ {totalPrice().toFixed(2).replace(".", ",")}
                        </p>
                    </div>
                    <Button onClick={handleCheckout} disabled={items.length === 0} className="w-full">
                        Ir para Checkout
                    </Button>
                    {items.length > 0 && (
                        <Button variant="outline" onClick={clearCart} className="w-full">
                            Limpar Carrinho
                        </Button>
                    )}
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
};

export default CartDrawer;