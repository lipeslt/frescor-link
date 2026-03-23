import api from "@/lib/api";

export interface OrderItem {
  produtoId: number;
  quantidade: number;
  precoUnitario: number;
}

export interface CreateOrderPayload {
  usuarioId: number;
  status: string;
  itens: OrderItem[];
}

export interface Order {
  id: number;
  usuarioId: number;
  status: string;
  total: number;
  criadoEm: string;
  itens: OrderItem[];
}

export const orderService = {
  create: (data: CreateOrderPayload) => api.post("/pedidos", data),
  getById: (id: number) => api.get<Order>(`/pedidos/${id}`),
  getAll: () => api.get<Order[]>("/pedidos"),
};
