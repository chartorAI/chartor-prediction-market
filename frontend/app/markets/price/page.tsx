"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { useMarkets } from "@/lib/hooks/useMarkets"
import { useAuthStore } from "@/stores/authStore"
import { useCreateMarket } from "@/lib/hooks/useCreateMarket"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { AssetTabs } from "@/components/markets/AssetTabs"
import { MarketCard } from "@/components/markets/MarketCard"
import { CreateMarketModal } from "@/components/markets/CreateMarketModal"
import { Button } from "@/components/ui/button"
import { ASSETS } from "@/lib/constants"
import type { Asset } from "@/types"

export default function PriceMarketsPage() {
  const [createMarketModalOpen, setCreateMarketModalOpen] = useState(false)
  const { allMarkets, isLoading } = useMarkets()
  const { isAuthenticated } = useAuthStore()
  const { createMarket, isCreating } = useCreateMarket()

  // Filter for price markets only
  const priceMarkets = allMarkets.filter(
    (m): m is Extract<typeof m, { type: "PRICE" }> =>
      m.type === "PRICE" && !m.resolved
  )

  // Group markets by asset
  const marketsByAsset = ASSETS.reduce(
    (acc, asset) => {
      acc[asset] = priceMarkets.filter((m) => m.asset === asset)
      return acc
    },
    {} as Record<Asset, typeof priceMarkets>
  )

  return (
    <div className="min-h-screen bg-background-primary">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Price Prediction Markets
              </h1>
              <p className="text-lg text-white/60 max-w-2xl">
                Predict future prices of BTC, ETH, BNB, GOLD, and OIL using
                real-time Pyth oracle data
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

        {/* Asset Tabs */}
        <div className="mb-12">
          <AssetTabs />
        </div>

        {/* Loading/Error States */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          /* Markets Overview by Asset */
          <div className="space-y-16">
            {ASSETS.map((asset) => {
              const assetMarkets = marketsByAsset[asset]
              return (
                <div key={asset}>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-2">
                        {asset}
                      </h2>
                      <p className="text-white/60">
                        {assetMarkets.length} active{" "}
                        {assetMarkets.length === 1 ? "market" : "markets"}
                      </p>
                    </div>
                    {assetMarkets.length > 0 && (
                      <Link
                        href={`/markets/price/${asset.toLowerCase()}`}
                        className="bg-white/5 border border-white/20 hover:bg-white/10 hover:border-primary text-white px-6 py-3 rounded-full font-medium transition-all flex items-center gap-2"
                      >
                        View All
                        <span>→</span>
                      </Link>
                    )}
                  </div>

                  {assetMarkets.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 backdrop-blur-xl p-12 rounded-3xl text-center">
                      <p className="text-white/60 text-lg">
                        No active markets for {asset} yet
                      </p>
                      <p className="text-white/40 text-sm mt-2">
                        Check back soon or create your own market
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {assetMarkets.slice(0, 3).map((market) => (
                        <MarketCard
                          key={market.id}
                          market={market}
                          showTradingButtons={true}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
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
