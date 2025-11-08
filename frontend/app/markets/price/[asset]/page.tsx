"use client"

import { useParams } from "next/navigation"
import { useEffect } from "react"
import { useMarkets } from "@/lib/hooks/useMarkets"
import { useMarketStore } from "@/stores/marketStore"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { TradingViewChart } from "@/components/charts/TradingViewChart"
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
                <div
                  key={market.id}
                  className="glass p-6 rounded-2xl hover:bg-white/10 transition-all"
                >
                  {/* Market Header */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-primary uppercase">
                      {asset}
                    </span>
                    <span className="text-xs text-white/40">
                      Ends{" "}
                      {new Date(market.deadline * 1000).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-white text-sm mb-4 min-h-[40px]">
                    {market.description}
                  </p>

                  {/* Target Price */}
                  {market.type === "PRICE" && (
                    <div className="mb-4 p-3 bg-white/5 rounded-lg">
                      <div className="text-xs text-white/60 mb-1">
                        Target Price
                      </div>
                      <div className="text-lg font-bold text-white">
                        ${(Number(market.targetPrice) / 1e8).toFixed(2)}
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-white/60 mb-4">
                    <span>
                      Volume:{" "}
                      {(Number(market.qYes + market.qNo) / 1e18).toFixed(2)} BNB
                    </span>
                  </div>

                  {/* Trading Buttons Placeholder */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg font-semibold transition-all"
                      disabled
                    >
                      YES
                    </button>
                    <button
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-semibold transition-all"
                      disabled
                    >
                      NO
                    </button>
                  </div>
                  <p className="text-xs text-white/40 text-center mt-2">
                    Trading interface coming soon
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
