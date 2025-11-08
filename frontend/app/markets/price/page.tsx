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
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Price Prediction Markets
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Predict future prices of BTC, ETH, BNB, GOLD, and OIL using
            real-time Pyth oracle data
          </p>
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
                        <Link
                          key={market.id}
                          href={`/markets/price/${asset.toLowerCase()}`}
                        >
                          <div className="bg-white/5 border border-white/10 backdrop-blur-xl p-6 rounded-2xl hover:bg-white/10 hover:border-primary/50 transition-all cursor-pointer h-full group">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-xs font-semibold text-primary uppercase px-3 py-1 bg-primary/10 rounded-full">
                                {asset}
                              </span>
                              <span className="text-xs text-white/40">
                                {new Date(
                                  market.deadline * 1000
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-white text-sm mb-6 line-clamp-2 min-h-[2.5rem]">
                              {market.description}
                            </p>
                            <div className="space-y-3 pt-4 border-t border-white/10">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-white/60">
                                  Target Price
                                </span>
                                <span className="text-white font-semibold">
                                  $
                                  {(Number(market.targetPrice) / 1e8).toFixed(
                                    2
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-white/60">Volume</span>
                                <span className="text-white font-semibold">
                                  {(
                                    Number(market.qYes + market.qNo) / 1e18
                                  ).toFixed(2)}{" "}
                                  BNB
                                </span>
                              </div>
                            </div>
                            <div className="mt-4 text-primary text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                              Trade Now
                              <span>→</span>
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
