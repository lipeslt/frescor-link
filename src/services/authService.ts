import api from "@/lib/api";

export interface LoginPayload {
  email: string;
  senha: string;
}

export interface RegisterPayload {
  nome: string;
  email: string;
  senha: string;
}

// Resposta real do AuthController.login():
// { accessToken, refreshToken, tipo, expiracaoEm }
// NÃO retorna "usuario" — precisamos buscá-lo separado
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tipo: string;
  expiracaoEm: number;
}

export const authService = {
  login: (data: LoginPayload) =>
      api.post<LoginResponse>("/auth/login", data),

  register: (data: RegisterPayload) =>
      api.post("/auth/registrar", data),

  // Decodifica o JWT para extrair os dados do usuário (id, nome, email)
  decodeToken: (token: string): { id: number; nome: string; email: string } | null => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return {
        id: payload.id,
        nome: payload.nome,
        email: payload.sub,
      };
    } catch {
      return null;
    }
  },
};