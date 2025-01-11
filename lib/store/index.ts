import { create } from 'zustand';
import { Account } from 'starknet';

interface WalletState {
  wallet: Account | null;
  setWallet: (wallet: Account | null) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  wallet: null,
  setWallet: (wallet) => set({ wallet }),
}));
