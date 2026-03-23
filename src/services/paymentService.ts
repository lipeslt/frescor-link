import api from "@/lib/api";

export const paymentService = {
  createPreference: (pedidoId: number, valor: number) =>
    api.post("/pagamentos/criar-preferencia", { pedidoId, valor }),
};
