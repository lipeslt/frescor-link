import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
    id: string;
    nome: string;
    email: string;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
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
            setUser: (user) => set({ user }),
            setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
            login: (user, accessToken, refreshToken) =>
                set({ user, accessToken, refreshToken, isAuthenticated: true }),
            logout: () =>
                set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
        }),
        { name: "auth-storage" }
    )
);