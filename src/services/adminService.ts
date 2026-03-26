import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export type StatusPedido =
  | "AGUARDANDO_PAGAMENTO"
  | "PAGO"
  | "SEPARACAO_ESTOQUE"
  | "ENVIADO"
  | "ENTREGUE"
  | "CANCELADO";

export type Role = "ADMIN" | "USER";

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface AdminUser {
  id: string;
  nome: string;
  email: string;
  role: Role;
  criadoEm: string;
}

export interface AdminCategoria {
  id: string;
  nome: string;
  descricao?: string;
}

export interface AdminProduto {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  estoque: number;
  categoriaId?: string;
  imagemUrl?: string;
  ativo: boolean;
}

export interface ItemPedido {
  produtoId: string;
  nomeProduto: string;
  quantidade: number;
  precoUnitario: number;
}

export interface AdminPedido {
  id: string;
  usuario: { id: string; nome: string; email: string };
  status: StatusPedido;
  valorTotal: number;
  dataCriacao: string;
}

export interface AdminPedidoDetalhe extends AdminPedido {
  itens: ItemPedido[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const adminService = {
  // Usuários
  getUsuarios: (page = 0, size = 20) =>
    api.get<PageResponse<AdminUser>>("/usuarios", { params: { page, size } }),

  updateUsuarioRole: (id: string, role: Role) =>
    api.put(`/usuarios/${id}/role`, { role }),

  // Pedidos
  getPedidos: (page = 0, size = 20, status?: StatusPedido) =>
    api.get<PageResponse<AdminPedido>>("/pedidos", {
      params: { page, size, ...(status ? { status } : {}) },
    }),

  getPedidoById: (id: string) =>
    api.get<AdminPedidoDetalhe>(`/pedidos/${id}`),

  updatePedidoStatus: (id: string, status: StatusPedido) =>
    api.put(`/pedidos/${id}/status`, { status }),

  // Categorias
  getCategorias: (page = 0, size = 50) =>
    api.get<PageResponse<AdminCategoria>>("/categorias", { params: { page, size } }),

  createCategoria: (data: Omit<AdminCategoria, "id">) =>
    api.post<AdminCategoria>("/categorias", data),

  updateCategoria: (id: string, data: Partial<Omit<AdminCategoria, "id">>) =>
    api.put<AdminCategoria>(`/categorias/${id}`, data),

  deleteCategoria: (id: string) =>
    api.delete(`/categorias/${id}`),

  // Produtos
  getProdutos: (page = 0, size = 20, nome?: string, categoriaId?: string) =>
    api.get<PageResponse<AdminProduto>>("/produtos", {
      params: { page, size, ...(nome ? { nome } : {}), ...(categoriaId ? { categoriaId } : {}) },
    }),

  createProduto: (data: Omit<AdminProduto, "id">) =>
    api.post<AdminProduto>("/produtos", data),

  updateProduto: (id: string, data: Partial<Omit<AdminProduto, "id">>) =>
    api.put<AdminProduto>(`/produtos/${id}`, data),

  deleteProduto: (id: string) =>
    api.delete(`/produtos/${id}`),
};
