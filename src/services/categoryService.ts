import api from "@/lib/api";

export interface Category {
  id: string;
  nome: string;
  descricao?: string;
  icone?: string;
  ativo?: boolean;
  criadoEm?: string;
  atualizadoEm?: string;
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