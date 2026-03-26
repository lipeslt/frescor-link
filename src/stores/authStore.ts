import { create } from "zustand";
import { persist } from "zustand/middleware";
import { jwtDecode } from "jwt-decode";

interface User {
    id: string;
    nome: string;
    email: string;
}

interface JwtPayload {
    id: string;
    nome: string;
    email: string;
    role: "ADMIN" | "USER";
}

type Role = "ADMIN" | "USER";

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    role: Role | null;
    isAdmin: boolean;
    setUser: (user: User) => void;
    setTokens: (access: string, refresh: string) => void;
    login: (user: User, access: string, refresh: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            role: null,
            isAdmin: false,
            setUser: (user) => set({ user }),
            setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
            login: (user, accessToken, refreshToken) => {
                let role: Role | null = null;
                try {
                    const decoded = jwtDecode<JwtPayload>(accessToken);
                    role = decoded.role ?? null;
                } catch {
                    role = null;
                }
                set({
                    user,
                    accessToken,
                    refreshToken,
                    isAuthenticated: true,
                    role,
                    isAdmin: role === "ADMIN",
                });
            },
            logout: () =>
                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                    role: null,
                    isAdmin: false,
                }),
        }),
        { name: "auth-storage" }
    )
);
