import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { setCookie, deleteCookie } from 'cookies-next';

interface User {
  _id: string;
  email: string;
  fullName: string;
  roles: string[];
  kycStatus: string;
  onChainAddress: string;
  createdAt: string;
  updatedAt: string;
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: User | null;
  tokens: Tokens | null;
  setUser: (user: User) => void;
  setTokens: (tokens: Tokens) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      setUser: (user) => set({ user }),
      setTokens: (tokens) => {
        set({ tokens });
        setCookie('accessToken', tokens.accessToken);
        setCookie('refreshToken', tokens.refreshToken);
      },
      logout: () => {
        set({ user: null, tokens: null });
        deleteCookie('accessToken');
        deleteCookie('refreshToken');
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
