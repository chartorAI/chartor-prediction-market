"use client"

import Link from "next/link"
import { useMarkets } from "@/lib/hooks/useMarkets"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { AssetTabs } from "@/components/markets/AssetTabs"
import { ASSETS } from "@/lib/constants"
import type { Asset } from "@/types"

export default function PriceMarketsPage() {
  const { allMarkets, isLoading } = useMarkets()

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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Price Markets</h1>
          <p className="text-white/60">
            Predict future prices of BTC, ETH, BNB, GOLD, and OIL
          </p>
        </div>

        {/* Asset Tabs */}
        <div className="mb-8">
          <AssetTabs />
        </div>

        {/* Loading/Error States */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          /* Markets Overview by Asset */
          <div className="space-y-12">
            {ASSETS.map((asset) => {
              const assetMarkets = marketsByAsset[asset]
              return (
                <div key={asset}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">{asset}</h2>
                    <Link
                      href={`/markets/price/${asset.toLowerCase()}`}
                      className="text-primary hover:text-primary/80 transition-colors font-semibold"
                    >
                      View All →
                    </Link>
                  </div>

                  {assetMarkets.length === 0 ? (
                    <div className="glass p-8 rounded-2xl text-center">
                      <p className="text-white/60">
                        No active markets for {asset}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {assetMarkets.slice(0, 3).map((market) => (
                        <Link
                          key={market.id}
                          href={`/markets/price/${asset.toLowerCase()}`}
                        >
                          <div className="glass p-6 rounded-2xl hover:bg-white/10 transition-all cursor-pointer h-full">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-semibold text-primary uppercase">
                                {asset}
                              </span>
                              <span className="text-xs text-white/40">
                                {new Date(
                                  market.deadline * 1000
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-white text-sm mb-4 line-clamp-2">
                              {market.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-white/60">
                                Target: $
                                {(Number(market.targetPrice) / 1e8).toFixed(2)}
                              </div>
                              <div className="text-xs text-white/60">
                                Volume:{" "}
                                {(
                                  Number(market.qYes + market.qNo) / 1e18
                                ).toFixed(2)}{" "}
                                BNB
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
