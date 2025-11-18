import { create } from "zustand"

interface AuthState {
  isAuthenticated: boolean
  userAddress: string | null
  smartAccountAddress: string | null
  smartAccount: any | null
  web3AuthProvider: any | null
  balance: bigint | null
  isLoading: boolean
  error: string | null

  // Actions
  setAuthenticated: (
    address: string,
    smartAccount: any,
    provider: any,
    smartAccountAddress: string
  ) => void
  setBalance: (balance: bigint) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  userAddress: null,
  smartAccountAddress: null,
  smartAccount: null,
  web3AuthProvider: null,
  balance: null,
  isLoading: false,
  error: null,

  setAuthenticated: (address, smartAccount, provider, smartAccountAddress) =>
    set({
      isAuthenticated: true,
      userAddress: address,
      smartAccountAddress,
      smartAccount,
      web3AuthProvider: provider,
      error: null,
    }),

  setBalance: (balance) => set({ balance }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  logout: () =>
    set({
      isAuthenticated: false,
      userAddress: null,
      smartAccountAddress: null,
      smartAccount: null,
      web3AuthProvider: null,
      balance: null,
      error: null,
    }),
}))
