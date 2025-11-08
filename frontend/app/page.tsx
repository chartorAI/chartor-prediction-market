"use client"

import Link from "next/link"
import { useMarkets } from "@/lib/hooks/useMarkets"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"

export default function Home() {
  const { allMarkets, isLoading } = useMarkets()

  // Calculate quick stats
  const activeMarkets = allMarkets.filter((m) => !m.resolved)
  const priceMarkets = activeMarkets.filter((m) => m.type === "PRICE")
  const liquidityMarkets = activeMarkets.filter((m) => m.type === "LIQUIDITY")

  // Calculate total volume (sum of qYes + qNo for all markets)
  const totalVolume = allMarkets.reduce(
    (sum, market) => sum + market.qYes + market.qNo,
    BigInt(0)
  )

  // Get recent markets (sorted by deadline, most recent first)
  const recentMarkets = [...activeMarkets]
    .sort((a, b) => b.deadline - a.deadline)
    .slice(0, 6)

  return (
    <main className="min-h-screen bg-background-primary">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-white mb-4">
            Prediction Markets
          </h1>
          <p className="text-xl text-white/60 mb-8">
            Decentralized prediction markets on BNB Chain
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="glass p-6 rounded-2xl">
              <div className="text-3xl font-bold text-white mb-2">
                {activeMarkets.length}
              </div>
              <div className="text-white/60">Active Markets</div>
            </div>
            <div className="glass p-6 rounded-2xl">
              <div className="text-3xl font-bold text-white mb-2">
                {(Number(totalVolume) / 1e18).toFixed(2)} BNB
              </div>
              <div className="text-white/60">Total Volume</div>
            </div>
            <div className="glass p-6 rounded-2xl">
              <div className="text-3xl font-bold text-white mb-2">
                {priceMarkets.length + liquidityMarkets.length}
              </div>
              <div className="text-white/60">Total Predictions</div>
            </div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-4xl mx-auto">
          <Link href="/markets/price">
            <div className="glass p-8 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group">
              <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
                Price Markets
              </h2>
              <p className="text-white/60 mb-4">
                Predict future prices of BTC, ETH, BNB, GOLD, and OIL
              </p>
              <div className="text-primary font-semibold">
                {priceMarkets.length} active markets →
              </div>
            </div>
          </Link>

          <Link href="/markets/liquidity">
            <div className="glass p-8 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group">
              <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
                Liquidity Markets
              </h2>
              <p className="text-white/60 mb-4">
                Predict BNB/USDT pool liquidity on PancakeSwap
              </p>
              <div className="text-primary font-semibold">
                {liquidityMarkets.length} active markets →
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Markets */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-6">Recent Markets</h2>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : recentMarkets.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-white/60 text-lg mb-4">
                No active markets yet
              </p>
              <p className="text-white/40 text-sm">
                Check back soon for new prediction markets
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentMarkets.map((market) => (
                <Link
                  key={market.id}
                  href={
                    market.type === "PRICE"
                      ? `/markets/price/${market.asset.toLowerCase()}`
                      : "/markets/liquidity"
                  }
                >
                  <div className="glass p-6 rounded-2xl hover:bg-white/10 transition-all cursor-pointer h-full">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-primary uppercase">
                        {market.type === "PRICE"
                          ? market.asset
                          : "BNB/USDT Liquidity"}
                      </span>
                      <span className="text-xs text-white/40">
                        {new Date(market.deadline * 1000).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-white text-sm mb-4 line-clamp-2">
                      {market.description}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/60">
                        Volume:{" "}
                        {(Number(market.qYes + market.qNo) / 1e18).toFixed(2)}{" "}
                        BNB
                      </span>
                      <span className="text-primary font-semibold">View →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
