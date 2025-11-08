"use client"

import { useMarkets } from "@/lib/hooks/useMarkets"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { TradingViewChart } from "@/components/charts/TradingViewChart"
import { TradingButtons } from "@/components/trading/TradingButtons"
import {
  calculateMarketPrices,
  calculateMarketVolume,
} from "@/lib/utils/marketPrices"

export default function LiquidityMarketsPage() {
  const { allMarkets, isLoading } = useMarkets()

  // Filter for liquidity markets only
  const liquidityMarkets = allMarkets.filter(
    (m) => m.type === "LIQUIDITY" && !m.resolved
  )

  // Sort by deadline (soonest first)
  const sortedMarkets = [...liquidityMarkets].sort(
    (a, b) => a.deadline - b.deadline
  )

  return (
    <div className="min-h-screen bg-background-primary">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Liquidity Prediction Markets
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Predict BNB/USDT pool liquidity on PancakeSwap V3 using real-time
            on-chain data
          </p>
        </div>

        {/* TradingView Chart for BNB/USDT */}
        <div className="mb-12">
          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden">
            <TradingViewChart
              symbol="BINANCE:BNBUSDT"
              asset="BNB"
              height={500}
            />
          </div>
        </div>

        {/* Markets List */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Active Liquidity Markets
              </h2>
              <p className="text-white/60">
                {sortedMarkets.length} active{" "}
                {sortedMarkets.length === 1 ? "market" : "markets"}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : sortedMarkets.length === 0 ? (
            <div className="bg-white/5 border border-white/10 backdrop-blur-xl p-12 rounded-3xl text-center">
              <p className="text-white/60 text-lg mb-2">
                No active liquidity markets yet
              </p>
              <p className="text-white/40 text-sm">
                Check back soon or create your own market
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
                        BNB/USDT
                      </span>
                      <span className="text-xs text-white/40">
                        {new Date(market.deadline * 1000).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-white text-sm mb-4 min-h-10 line-clamp-2">
                      {market.description}
                    </p>

                    {/* Target Liquidity */}
                    <div className="mb-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                      <div className="text-xs text-white/60 mb-2">
                        Target Liquidity
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {market.type === "LIQUIDITY"
                          ? (Number(market.targetLiquidity) / 1e18).toFixed(2)
                          : "N/A"}{" "}
                        <span className="text-base text-white/60">BNB</span>
                      </div>
                    </div>

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
