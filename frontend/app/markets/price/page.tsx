"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { useMarkets } from "@/lib/hooks/useMarkets"
import { useAuthStore } from "@/stores/authStore"
import { useCreateMarket } from "@/lib/hooks/useCreateMarket"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { TradingViewChart } from "@/components/charts/TradingViewChart"
import { MarketCard } from "@/components/markets/MarketCard"
import { CreateMarketModal } from "@/components/markets/CreateMarketModal"
import { Button } from "@/components/ui/button"
import { ASSETS, TRADINGVIEW_SYMBOLS, type Asset } from "@/lib/constants"

export default function PriceMarketsPage() {
  const [createMarketModalOpen, setCreateMarketModalOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | "ALL">("ALL")
  const { allMarkets, isLoading } = useMarkets()
  const { isAuthenticated } = useAuthStore()
  const { createMarket, isCreating } = useCreateMarket()

  // Filter for price markets only
  const priceMarkets = allMarkets.filter(
    (m): m is Extract<typeof m, { type: "PRICE" }> =>
      m.type === "PRICE" && !m.resolved
  )

  // Filter by selected asset
  const filteredMarkets =
    selectedAsset === "ALL"
      ? priceMarkets
      : priceMarkets.filter((m) => m.asset === selectedAsset)

  // Sort by deadline (soonest first)
  const sortedMarkets = [...filteredMarkets].sort(
    (a, b) => a.deadline - b.deadline
  )

  return (
    <div className="min-h-screen bg-background-primary">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Price Prediction Markets
              </h1>
              <p className="text-lg text-white/60 max-w-2xl">
                Predict future prices across 20+ assets using real-time Pyth
                oracle data
              </p>
            </div>
            {isAuthenticated && (
              <Button
                onClick={() => setCreateMarketModalOpen(true)}
                className="bg-gradient-to-br from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Market
              </Button>
            )}
          </div>
        </div>

        {/* Asset Filter Tabs */}
        <div className="mb-8">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {/* ALL button */}
            <button
              onClick={() => setSelectedAsset("ALL")}
              className={`
                px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all
                ${
                  selectedAsset === "ALL"
                    ? "bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg"
                    : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                }
              `}
            >
              ALL ({priceMarkets.length})
            </button>

            {/* Asset buttons */}
            {ASSETS.map((asset) => {
              const count = priceMarkets.filter((m) => m.asset === asset).length
              return (
                <button
                  key={asset}
                  onClick={() => setSelectedAsset(asset)}
                  className={`
                    px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all
                    ${
                      selectedAsset === asset
                        ? "bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg"
                        : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                    }
                  `}
                >
                  {asset} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* TradingView Chart (only show when specific asset selected) */}
        {selectedAsset !== "ALL" && TRADINGVIEW_SYMBOLS[selectedAsset] && (
          <div className="mb-8">
            <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden">
              <TradingViewChart
                symbol={TRADINGVIEW_SYMBOLS[selectedAsset]!}
                asset={selectedAsset as any}
                height={500}
              />
            </div>
          </div>
        )}

        {/* Markets Grid */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : sortedMarkets.length === 0 ? (
          <div className="bg-white/5 border border-white/10 backdrop-blur-xl p-12 rounded-3xl text-center">
            <p className="text-white/60 text-lg mb-2">
              No active markets for{" "}
              {selectedAsset === "ALL" ? "any asset" : selectedAsset}
            </p>
            <p className="text-white/40 text-sm">
              Check back soon or create your own market
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {selectedAsset === "ALL"
                  ? "All Markets"
                  : `${selectedAsset} Markets`}
              </h2>
              <p className="text-white/60">
                {sortedMarkets.length}{" "}
                {sortedMarkets.length === 1 ? "market" : "markets"}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedMarkets.map((market) => (
                <MarketCard
                  key={market.id}
                  market={market}
                  showTradingButtons={true}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Market Modal */}
      <CreateMarketModal
        isOpen={createMarketModalOpen}
        onClose={() => setCreateMarketModalOpen(false)}
        onSubmit={async (data) => {
          const result = await createMarket(data)
          if (result.success) {
            setCreateMarketModalOpen(false)
          }
        }}
        isSubmitting={isCreating}
      />
    </div>
  )
}
