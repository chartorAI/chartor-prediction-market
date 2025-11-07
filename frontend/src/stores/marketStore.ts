import { create } from "zustand"
import type { Market, Asset } from "@/types"

interface MarketState {
  markets: Market[]
  selectedAsset: Asset
  selectedMarketType: "PRICE" | "LIQUIDITY"
  isLoading: boolean
  error: string | null

  // Actions
  setMarkets: (markets: Market[]) => void
  setSelectedAsset: (asset: Asset) => void
  setSelectedMarketType: (type: "PRICE" | "LIQUIDITY") => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  updateMarket: (marketId: string, updates: Partial<Market>) => void
}

export const useMarketStore = create<MarketState>((set) => ({
  markets: [],
  selectedAsset: "BTC",
  selectedMarketType: "PRICE",
  isLoading: false,
  error: null,

  setMarkets: (markets) => set({ markets }),

  setSelectedAsset: (asset) => set({ selectedAsset: asset }),

  setSelectedMarketType: (type) => set({ selectedMarketType: type }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  updateMarket: (marketId, updates) =>
    set((state) => ({
      markets: state.markets.map((market) =>
        market.id === marketId ? ({ ...market, ...updates } as Market) : market
      ),
    })),
}))
