import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { productService, type Product } from "@/services/productService";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "@/hooks/use-toast";

const fallbackProducts: Product[] = [
  { id: 1, nome: "Banana Prata (kg)", preco: 5.99, estoque: 50, imagemUrl: "", categoriaId: 1 },
  { id: 2, nome: "Tomate Italiano (kg)", preco: 8.49, estoque: 30, imagemUrl: "", categoriaId: 1 },
  { id: 3, nome: "Peito de Frango (kg)", preco: 16.90, estoque: 20, imagemUrl: "", categoriaId: 2 },
  { id: 4, nome: "Leite Integral 1L", preco: 4.79, estoque: 100, imagemUrl: "", categoriaId: 3 },
  { id: 5, nome: "Pão Francês (kg)", preco: 12.90, estoque: 40, imagemUrl: "", categoriaId: 4 },
  { id: 6, nome: "Suco de Laranja 1L", preco: 7.49, estoque: 35, imagemUrl: "", categoriaId: 5 },
  { id: 7, nome: "Pizza Congelada", preco: 14.99, estoque: 15, imagemUrl: "", categoriaId: 6 },
  { id: 8, nome: "Maçã Fuji (kg)", preco: 9.99, estoque: 45, imagemUrl: "", categoriaId: 7 },
];

interface Props {
  categoryId?: number | null;
}

const ProductGrid = ({ categoryId }: Props) => {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [loading, setLoading] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    setLoading(true);
    const fetch = categoryId
      ? productService.getByCategory(categoryId)
      : productService.getAll();

    fetch
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : (data as any)?.content;
        if (list?.length) setProducts(list);
        else setProducts(fallbackProducts);
      })
      .catch(() => setProducts(fallbackProducts))
      .finally(() => setLoading(false));
  }, [categoryId]);

  const handleAdd = (product: Product) => {
    addItem(product);
    toast({ title: "Adicionado!", description: `${product.nome} no carrinho.` });
  };

  return (
    <section className="pb-14">
      <div className="container">
        <h2 className="mb-6 text-2xl font-extrabold md:text-3xl">
          {categoryId ? "Produtos" : "🔥 Ofertas da Semana"}
        </h2>
        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="relative aspect-square bg-muted overflow-hidden">
                  {p.imagemUrl ? (
                    <img src={p.imagemUrl} alt={p.nome} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package size={48} className="text-muted-foreground/30" />
                    </div>
                  )}
                  {p.estoque <= 5 && p.estoque > 0 && (
                    <span className="absolute top-2 left-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">
                      Últimas unidades
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <h3 className="text-sm font-semibold leading-snug line-clamp-2">{p.nome}</h3>
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
