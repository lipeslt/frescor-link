import api from "@/lib/api";

export interface Category {
  id: number;
  nome: string;
  icone?: string;
}

export const categoryService = {
  getAll: (page = 0, size = 20) =>
    api.get("/categorias", { params: { page, size } }),
};
