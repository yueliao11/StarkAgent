import { create } from 'zustand';
import { ConnectedStarknetWindowObject } from 'get-starknet-core';

interface WalletState {
  wallet: ConnectedStarknetWindowObject | null;
  setWallet: (wallet: ConnectedStarknetWindowObject | null) => void;
  isConnecting: boolean;
  setIsConnecting: (isConnecting: boolean) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  wallet: null,
  setWallet: (wallet) => set({ wallet }),
  isConnecting: false,
  setIsConnecting: (isConnecting) => set({ isConnecting }),
}));