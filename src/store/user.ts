import { create } from 'zustand';

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

interface Wallet {
  _id: string;
  userId: string;
  liveBalanceUsd: number;
  demoBalanceUsd: number;
  bonusBalanceUsd: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

interface UserState {
  user: User | null;
  wallet: Wallet | null;
  tradingMode: 'LIVE' | 'DEMO';
  setUser: (user: User) => void;
  setWallet: (wallet: Wallet) => void;
  setTradingMode: (mode: 'LIVE' | 'DEMO') => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  wallet: null,
  tradingMode: 'LIVE',
  setUser: (user) => set({ user }),
  setWallet: (wallet) => set({ wallet }),
  setTradingMode: (mode) => set({ tradingMode: mode }),
}));
