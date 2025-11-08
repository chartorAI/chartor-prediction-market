"use client"

import { useParams } from "next/navigation"
import { useEffect } from "react"
import { useMarkets } from "@/lib/hooks/useMarkets"
import { useMarketStore } from "@/stores/marketStore"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { TradingViewChart } from "@/components/charts/TradingViewChart"
import { TradingButtons } from "@/components/trading/TradingButtons"
import {
  calculateMarketPrices,
  calculateMarketVolume,
} from "@/lib/utils/marketPrices"
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
              {sortedMarkets.map((market) => {
                // Calculate YES/NO prices using LMSR formula
                const { yesPricePercent, noPricePercent } =
                  calculateMarketPrices(market)
                const totalVolume = calculateMarketVolume(market)

                return (
                  <div
                    key={market.id}
                    className="bg-white/5 border border-white/10 backdrop-blur-xl p-6 rounded-2xl hover:bg-white/10 hover:border-primary/50 transition-all flex flex-col"
                  >
                    {/* Market Header */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold text-primary uppercase px-3 py-1 bg-primary/10 rounded-full">
                        {asset}
                      </span>
                      <span className="text-xs text-white/40">
                        {new Date(market.deadline * 1000).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-white text-sm mb-4 min-h-10 line-clamp-2">
                      {market.description}
                    </p>

                    {/* Target Price */}
                    {market.type === "PRICE" && (
                      <div className="mb-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                        <div className="text-xs text-white/60 mb-2">
                          Target Price
                        </div>
                        <div className="text-2xl font-bold text-white">
                          ${(Number(market.targetPrice) / 1e8).toFixed(2)}
                        </div>
                      </div>
                    )}

                    {/* YES/NO Prices from LMSR */}
                    <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/10">
                      <div className="flex-1">
                        <div className="text-xs text-white/60 mb-1">YES</div>
                        <div className="text-lg font-bold text-success">
                          {yesPricePercent.toFixed(1)}%
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-white/60 mb-1">NO</div>
                        <div className="text-lg font-bold text-error">
                          {noPricePercent.toFixed(1)}%
                        </div>
                      </div>
                      <div className="flex-1 text-right">
                        <div className="text-xs text-white/60 mb-1">Volume</div>
                        <div className="text-sm font-semibold text-white">
                          {totalVolume.toFixed(2)} BNB
                        </div>
                      </div>
                    </div>

                    {/* Trading Buttons */}
                    <div className="mt-auto">
                      <TradingButtons market={market} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
