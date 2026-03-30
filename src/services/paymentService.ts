import api from "@/lib/api";

export interface CreatePreferencePayload {
  pedidoId: string;
  metodo: string;
}

export interface PreferenceResponse {
  initPoint: string;
  preferenceId: string;
}

export interface PaymentStatusResponse {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'REFUNDED';
  mercadoPagoId?: string;
  amount?: number;
}

export const paymentService = {
  createPreference: async (payload: CreatePreferencePayload): Promise<PreferenceResponse> => {
    const { data } = await api.post<PreferenceResponse>("/payments", payload);
    return data;
  },

  getPaymentStatus: (pedidoId: string) =>
    api.get<PaymentStatusResponse>(`/payments/pedido/${pedidoId}`),
};
