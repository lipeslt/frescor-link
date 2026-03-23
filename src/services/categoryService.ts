import api from "@/lib/api";

// Alinhado com a entidade Categoria do backend:
// id, nome, descricao, createdAt, updatedAt
export interface Category {
  id: number;
  nome: string;
  descricao?: string;
  icone?: string; // campo extra para uso no frontend (não vem do backend)
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
}

export const categoryService = {
  getAll: (page = 0, size = 20) =>
      api.get<PageResponse<Category>>("/categorias", { params: { page, size } }),
};