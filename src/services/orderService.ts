import api from "@/lib/api";

export interface CreateOrderPayload {
  usuarioId: string;
  valorTotal: number;
}

export interface Order {
  id: string;
  usuarioId?: string;
  status: string;
  total?: number;
  criadoEm?: string;
  dataPedido?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: string;
  produtoId: string;
  nomeProduto: string;
  quantidade: number;
  precoUnitario: number;
}

export interface PedidoResponse {
  id: string;
  usuario: {
    id: string;
    nome: string;
    email: string;
  };
  status: string;
  valorTotal?: number;
  dataPedido?: string;
  createdAt?: string;
  updatedAt?: string;
  itens?: OrderItem[];
}

export const orderService = {
  create: (data: CreateOrderPayload) =>
      api.post<PedidoResponse>("/pedidos", data),

  getById: (id: string) =>
      api.get<PedidoResponse>(`/pedidos/${id}`),

  getAll: (page = 0, size = 20) =>
      api.get<{ content: PedidoResponse[]; totalElements: number }>("/pedidos", {
        params: { page, size },
      }),

  updateStatus: (id: string, status: string, usuarioId: string) =>
      api.put<PedidoResponse>(`/pedidos/${id}`, { usuarioId, status }),

  getByUser: (usuarioId: string) =>
      api.get<PedidoResponse[]>(`/pedidos/usuario/${usuarioId}`),
};