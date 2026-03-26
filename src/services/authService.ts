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
}

export const authService = {
  login: (data: LoginPayload) =>
      api.post<LoginResponse>("/auth/login", data),

  register: (data: RegisterPayload) =>
      api.post<LoginResponse>("/auth/register", data),

  decodeToken: (token: string): { id: string; nome: string; email: string } | null => {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      return {
        id: payload.id || "",
        nome: payload.nome || "Usuário",
        email: payload.email || payload.sub || "",
      };
    } catch (error) {
      console.error("Erro ao decodificar token:", error);
      return null;
    }
  },
};