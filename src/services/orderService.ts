import api from "@/lib/api";

// PedidoRequestDTO só aceita usuarioId e status (o backend não recebe itens nesse endpoint)
// Os itens são gerenciados separadamente via ItemPedido (se implementado)
// Por ora, criamos o pedido e simulamos localmente
export interface CreateOrderPayload {
  usuarioId: number;
  status: string;
  // Nota: o backend atual (PedidoRequestDTO) NÃO tem campo "itens"
  // O carrinho é gerenciado no frontend e o total calculado localmente
}

export interface Order {
  id: number;
  usuarioId: number; // não existe diretamente — vem de usuario.id
  status: string;
  total?: number;      // não existe no modelo — calculado pelo frontend
  criadoEm?: string;   // mapeado de createdAt
  dataPedido?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Resposta real do Pedido: { id, usuario: {id, nome, email}, status, dataPedido, createdAt, updatedAt }
export interface PedidoResponse {
  id: number;
  usuario: {
    id: number;
    nome: string;
    email: string;
  };
  status: string;
  dataPedido?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const orderService = {
  create: (data: CreateOrderPayload) =>
      api.post<PedidoResponse>("/pedidos", data),

  getById: (id: number) =>
      api.get<PedidoResponse>(`/pedidos/${id}`),

  getAll: (page = 0, size = 20) =>
      api.get<{ content: PedidoResponse[]; totalElements: number }>("/pedidos", {
        params: { page, size },
      }),

  updateStatus: (id: number, status: string, usuarioId: number) =>
      api.put<PedidoResponse>(`/pedidos/${id}`, { usuarioId, status }),
};