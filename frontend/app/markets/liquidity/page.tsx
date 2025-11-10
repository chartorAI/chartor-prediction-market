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

export default function LiquidityMarketsPage() {
  const [createMarketModalOpen, setCreateMarketModalOpen] = useState(false)
  const { allMarkets, isLoading } = useMarkets()
  const { isAuthenticated } = useAuthStore()
  const { createMarket, isCreating } = useCreateMarket()

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
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Liquidity Prediction Markets
              </h1>
              <p className="text-lg text-white/60 max-w-2xl">
                Predict BNB/USDT pool liquidity on PancakeSwap V3 using
                real-time on-chain data
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
