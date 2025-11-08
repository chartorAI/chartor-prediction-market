"use client"

import Link from "next/link"
import { TrendingUp, TrendingDown, Clock } from "lucide-react"

export default function Home() {
  // Mock market data - will be replaced with real data later
  const markets = [
    {
      id: "1",
      type: "PRICE",
      asset: "BTC",
      question: "Will BTC reach $100,000 by Dec 31?",
      yesPrice: 65,
      noPrice: 35,
      volume: "12.5K",
      deadline: "2d 5h",
      trend: "up",
    },
    {
      id: "2",
      type: "PRICE",
      asset: "ETH",
      question: "Will ETH surpass $5,000 this month?",
      yesPrice: 42,
      noPrice: 58,
      volume: "8.3K",
      deadline: "5d 12h",
      trend: "down",
    },
    {
      id: "3",
      type: "LIQUIDITY",
      asset: "BNB",
      question: "Will BNB/USDT pool exceed $50M liquidity?",
      yesPrice: 55,
      noPrice: 45,
      volume: "15.2K",
      deadline: "1d 8h",
      trend: "up",
    },
    {
      id: "4",
      type: "PRICE",
      asset: "GOLD",
      question: "Will Gold hit $2,100/oz by year end?",
      yesPrice: 71,
      noPrice: 29,
      volume: "6.7K",
      deadline: "3d 2h",
      trend: "up",
    },
    {
      id: "5",
      type: "PRICE",
      asset: "OIL",
      question: "Will Oil drop below $70/barrel?",
      yesPrice: 38,
      noPrice: 62,
      volume: "4.9K",
      deadline: "6d 15h",
      trend: "down",
    },
    {
      id: "6",
      type: "LIQUIDITY",
      asset: "BNB",
      question: "Will pool liquidity double in 30 days?",
      yesPrice: 28,
      noPrice: 72,
      volume: "9.1K",
      deadline: "4d 20h",
      trend: "up",
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8 border-b border-border-subtle">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-white">
            Prediction Markets
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Trade on crypto prices and DeFi liquidity predictions
          </p>
        </div>
      </section>

      {/* Markets Grid */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {markets.map((market) => (
              <Link
                key={market.id}
                href={
                  market.type === "PRICE"
                    ? "/markets/price"
                    : "/markets/liquidity"
                }
                className="glass-card p-6 hover:border-primary/50 transition-all group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono px-2 py-1 rounded bg-primary/20 text-primary">
                      {market.asset}
                    </span>
                    <span className="text-xs text-text-secondary">
                      {market.type}
                    </span>
                  </div>
                  {market.trend === "up" ? (
                    <TrendingUp className="w-4 h-4 text-success" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-error" />
                  )}
                </div>

                {/* Question */}
                <h3 className="text-base font-medium text-white mb-4 group-hover:text-primary transition-colors">
                  {market.question}
                </h3>

                {/* Prices */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="glass-medium p-3 rounded-lg">
                    <div className="text-xs text-text-secondary mb-1">YES</div>
                    <div className="text-xl font-bold text-success">
                      {market.yesPrice}%
                    </div>
                  </div>
                  <div className="glass-medium p-3 rounded-lg">
                    <div className="text-xs text-text-secondary mb-1">NO</div>
                    <div className="text-xl font-bold text-error">
                      {market.noPrice}%
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{market.deadline}</span>
                  </div>
                  <span className="font-mono">${market.volume}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
