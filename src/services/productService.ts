import api from "@/lib/api";

// Alinhado com ProdutoResponseDTO do backend:
// id, nome, descricao, preco, estoque, categoriaId, createdAt, updatedAt
export interface Product {
  id: number;
  nome: string;
  descricao?: string;
  preco: number;
  estoque: number;
  categoriaId: number;
  imagemUrl?: string; // campo extra para exibição (pode não vir do backend)
  createdAt?: string;
  updatedAt?: string;
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

  getByCategory: (categoriaId: number, page = 0, size = 12) =>
      api.get<PageResponse<Product>>(`/produtos/categoria/${categoriaId}`, {
        params: { page, size },
      }),

  getById: (id: number) =>
      api.get<Product>(`/produtos/${id}`),
};