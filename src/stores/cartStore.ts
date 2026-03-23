import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/services/productService";

export interface CartItem {
    product: Product;
    quantity: number;
}

interface CartState {
    items: CartItem[];
    addItem: (product: Product) => void;
    removeItem: (productId: number) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    clearCart: () => void;
    totalItems: () => number;
    totalPrice: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (product) =>
                set((state) => {
                    const existing = state.items.find((i) => i.product.id === product.id);
                    if (existing) {
                        return {
                            items: state.items.map((i) =>
                                i.product.id === product.id
                                    ? { ...i, quantity: i.quantity + 1 }
                                    : i
                            ),
                        };
                    }
                    return { items: [...state.items, { product, quantity: 1 }] };
                }),
            removeItem: (productId) =>
                set((state) => ({
                    items: state.items.filter((i) => i.product.id !== productId),
                })),
            updateQuantity: (productId, quantity) =>
                set((state) => ({
                    items:
                        quantity <= 0
                            ? state.items.filter((i) => i.product.id !== productId)
                            : state.items.map((i) =>
                                i.product.id === productId ? { ...i, quantity } : i
                            ),
                })),
            clearCart: () => set({ items: [] }),
            totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
            totalPrice: () =>
                get().items.reduce((sum, i) => sum + i.product.preco * i.quantity, 0),
        }),
        { name: "cart-storage" }
    )
);