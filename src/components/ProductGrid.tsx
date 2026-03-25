import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { productService, type Product } from "@/services/productService";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "@/hooks/use-toast";

const fallbackProducts: Product[] = [
    { id: "1", nome: "Banana Prata (kg)", preco: 5.99, estoque: 50, categoria: { id: "1", nome: "Frutas" } },
    { id: "2", nome: "Tomate Italiano (kg)", preco: 8.49, estoque: 30, categoria: { id: "1", nome: "Frutas" } },
    { id: "3", nome: "Peito de Frango (kg)", preco: 16.90, estoque: 20, categoria: { id: "2", nome: "Carnes" } },
    { id: "4", nome: "Leite Integral 1L", preco: 4.79, estoque: 100, categoria: { id: "3", nome: "Laticínios" } },
    { id: "5", nome: "Pão Francês (kg)", preco: 12.90, estoque: 40, categoria: { id: "4", nome: "Padaria" } },
    { id: "6", nome: "Suco de Laranja 1L", preco: 7.49, estoque: 35, categoria: { id: "5", nome: "Bebidas" } },
    { id: "7", nome: "Pizza Congelada", preco: 14.99, estoque: 15, categoria: { id: "6", nome: "Congelados" } },
    { id: "8", nome: "Maçã Fuji (kg)", preco: 9.99, estoque: 45, categoria: { id: "7", nome: "Frutas" } },
];

interface Props {
    categoryId?: string | null;
    searchQuery?: string;
}

const ProductGrid = ({ categoryId, searchQuery }: Props) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [usingFallback, setUsingFallback] = useState(false);
    const addItem = useCartStore((s) => s.addItem);

    useEffect(() => {
        setLoading(true);
        setUsingFallback(false);

        const request = categoryId
            ? productService.getByCategory(categoryId)
            : productService.getAll();

        request
            .then(({ data }) => {
                const list = (data as any)?.content ?? (Array.isArray(data) ? data : []);
                if (list.length > 0) {
                    setProducts(list);
                } else {
                    setProducts(fallbackProducts);
                    setUsingFallback(true);
                }
            })
            .catch(() => {
                setProducts(fallbackProducts);
                setUsingFallback(true);
            })
            .finally(() => setLoading(false));
    }, [categoryId]);

    const displayProducts = searchQuery
        ? products.filter((p) =>
            p.nome.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : products;

    const handleAdd = (product: Product) => {
        addItem(product);
        toast({ title: "Adicionado!", description: `${product.nome} adicionado ao carrinho.` });
    };

    return (
        <section className="pb-14">
            <div className="container">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-extrabold md:text-3xl">
                        {categoryId ? "Produtos da Categoria" : "🔥 Ofertas da Semana"}
                    </h2>
                    {usingFallback && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              Exibindo produtos de demonstração
            </span>
                    )}
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-64 animate-pulse rounded-xl bg-muted" />
                        ))}
                    </div>
                ) : displayProducts.length === 0 ? (
                    <div className="text-center py-16">
                        <Package size={48} className="mx-auto text-muted-foreground/40 mb-3" />
                        <p className="text-muted-foreground">
                            {searchQuery
                                ? `Nenhum produto encontrado para "${searchQuery}"`
                                : "Nenhum produto nesta categoria."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                        {displayProducts.map((p, i) => (
                            <motion.div
                                key={p.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: i * 0.04 }}
                                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm hover:shadow-lg transition-shadow"
                            >
                                <div className="relative aspect-square bg-muted overflow-hidden">
                                    {p.imagemUrl ? (
                                        <img
                                            src={p.imagemUrl}
                                            alt={p.nome}
                                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center">
                                            <Package size={48} className="text-muted-foreground/30" />
                                        </div>
                                    )}
                                    {p.estoque > 0 && p.estoque <= 5 && (
                                        <span className="absolute top-2 left-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">
                      Últimas unidades
                    </span>
                                    )}
                                    {p.estoque === 0 && (
                                        <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                                            <span className="text-xs font-bold text-muted-foreground">Indisponível</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-1 flex-col p-3">
                                    <h3 className="text-sm font-semibold leading-snug line-clamp-2">{p.nome}</h3>
                                    {p.descricao && (
                                        <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{p.descricao}</p>
                                    )}
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {p.estoque > 0 ? `${p.estoque} em estoque` : "Indisponível"}
                                    </p>
                                    <div className="mt-auto pt-2 flex items-end justify-between">
                    <span className="text-lg font-extrabold text-primary">
                      R$ {p.preco.toFixed(2).replace(".", ",")}
                    </span>
                                        <Button
                                            size="sm"
                                            disabled={p.estoque <= 0}
                                            onClick={() => handleAdd(p)}
                                            className="h-9 w-9 p-0 rounded-full"
                                        >
                                            <ShoppingCart size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default ProductGrid;