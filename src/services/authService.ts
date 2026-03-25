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

export interface LoginResponse {
  token: string;
  refreshToken: string;
  tipo: string;
  expiracaoEm: number;
}

export const authService = {
  login: (data: LoginPayload) =>
      api.post<LoginResponse>("/auth/login", data),

  register: (data: RegisterPayload) =>
      api.post<LoginResponse>("/auth/register", data),

  decodeToken: (token: string): { id: string; nome: string; email: string } | null => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return {
        id: payload.sub,
        nome: payload.nome,
        email: payload.email,
      };
    } catch {
      return null;
    }
  },
};