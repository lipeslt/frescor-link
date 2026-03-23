import api from "@/lib/api";

export interface Product {
  id: number;
  nome: string;
  preco: number;
  estoque: number;
  imagemUrl: string;
  categoriaId: number;
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
  getByCategory: (categoriaId: number) =>
    api.get<Product[]>(`/produtos/categoria/${categoriaId}`),
};
