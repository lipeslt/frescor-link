import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Apple, Beef, Milk, Wheat, Coffee, IceCream, ShoppingBasket, Carrot } from "lucide-react";
import { categoryService, type Category } from "@/services/categoryService";

const iconMap: Record<string, React.ElementType> = {
  frutas: Apple,
  carnes: Beef,
  laticinios: Milk,
  padaria: Wheat,
  bebidas: Coffee,
  congelados: IceCream,
  hortifruti: Carrot,
};

const fallbackCategories: Category[] = [
  { id: "1", nome: "Hortifruti", icone: "hortifruti" },
  { id: "2", nome: "Carnes", icone: "carnes" },
  { id: "3", nome: "Laticínios", icone: "laticinios" },
  { id: "4", nome: "Padaria", icone: "padaria" },
  { id: "5", nome: "Bebidas", icone: "bebidas" },
  { id: "6", nome: "Congelados", icone: "congelados" },
  { id: "7", nome: "Frutas", icone: "frutas" },
  { id: "8", nome: "Mercearia", icone: "" },
];

interface Props {
  onSelect?: (categoryId: string | null) => void;
  selected?: string | null;
}

const DepartmentGrid = ({ onSelect, selected }: Props) => {
  const [categories, setCategories] = useState<Category[]>(fallbackCategories);

  useEffect(() => {
    categoryService
        .getAll()
        .then(({ data }) => {
          if (data?.content?.length) {
            setCategories(data.content);
          }
        })
        .catch(() => {});
  }, []);

  return (
      <section className="py-10 md:py-14">
        <div className="container">
          <h2 className="mb-6 text-2xl font-extrabold md:text-3xl">Departamentos</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8">
            {categories.map((cat, i) => {
              const Icon = iconMap[cat.icone || ""] || ShoppingBasket;
              const isActive = selected === cat.id;
              return (
                  <motion.button
                      key={cat.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all hover:shadow-md ${
                          isActive
                              ? "border-primary bg-accent shadow-md"
                              : "border-border bg-card hover:border-primary/30"
                      }`}
                      onClick={() => onSelect?.(isActive ? null : cat.id)}
                  >
                    <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full ${
                            isActive ? "bg-primary text-primary-foreground" : "bg-fresh-green-light text-primary"
                        }`}
                    >
                      <Icon size={24} />
                    </div>
                    <span className="text-xs font-semibold text-center">{cat.nome}</span>
                  </motion.button>
              );
            })}
          </div>
        </div>
      </section>
  );
};

export default DepartmentGrid;