"use client"

import { useParams } from "next/navigation"
import { useEffect } from "react"
import { useMarkets } from "@/lib/hooks/useMarkets"
import { useMarketStore } from "@/stores/marketStore"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { TradingViewChart } from "@/components/charts/TradingViewChart"
import { MarketCard } from "@/components/markets/MarketCard"
import { TRADINGVIEW_SYMBOLS, ASSETS } from "@/lib/constants"
import type { Asset } from "@/types"

export default function AssetMarketPage() {
  const params = useParams()
  const assetParam = params.asset as string

  // Convert URL param to uppercase Asset type
  const asset = assetParam?.toUpperCase() as Asset

  const { allMarkets, isLoading } = useMarkets()
  const { setSelectedAsset } = useMarketStore()

  // Validate asset
  const isValidAsset = ASSETS.includes(asset)

  // Update selected asset in store
  useEffect(() => {
    if (isValidAsset) {
      setSelectedAsset(asset)
    }
  }, [asset, isValidAsset, setSelectedAsset])

  // Filter markets for this asset
  const assetMarkets = allMarkets.filter(
    (m) => m.type === "PRICE" && m.asset === asset && !m.resolved
  )

  // Sort by deadline (soonest first)
  const sortedMarkets = [...assetMarkets].sort(
    (a, b) => a.deadline - b.deadline
  )

  if (!isValidAsset) {
    return (
      <div className="min-h-screen bg-background-primary">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <h1 className="text-3xl font-bold text-white mb-4">
              Invalid Asset
            </h1>
            <p className="text-white/60">
              The asset "{assetParam}" is not supported.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const symbol = TRADINGVIEW_SYMBOLS[asset]

  return (
    <div className="min-h-screen bg-background-primary">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {asset} Price Markets
          </h1>
          <p className="text-white/60">
            Predict future {asset} prices and trade on outcomes
          </p>
        </div>

        {/* TradingView Chart */}
        <div className="mb-8">
          <TradingViewChart symbol={symbol} asset={asset} height={500} />
        </div>

        {/* Markets List */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">
            Active Markets for {asset}
          </h2>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : sortedMarkets.length === 0 ? (
            <div className="glass p-12 rounded-2xl text-center">
              <p className="text-white/60 text-lg mb-2">
                No active markets for {asset}
              </p>
              <p className="text-white/40 text-sm">
                Check back soon for new prediction markets
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedMarkets.map((market) => (
                <MarketCard
                  key={market.id}
                  market={market}
                  showTradingButtons={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
