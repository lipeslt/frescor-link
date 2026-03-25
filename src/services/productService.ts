import api from "@/lib/api";

export interface Product {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  estoque: number;
  categoria?: {
    id: string;
    nome: string;
  };
  imagemUrl?: string;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
}

export const productService = {
  getAll: (page = 0, size = 12, sort = "nome") =>
      api.get<PageResponse<Product>>("/produtos", { params: { page, size, sort } }),

  getByCategory: (categoriaId: string, page = 0, size = 12) =>
      api.get<PageResponse<Product>>("/produtos", {
        params: { categoria: categoriaId, page, size },
      }),

  getById: (id: string) =>
      api.get<Product>(`/produtos/${id}`),
};