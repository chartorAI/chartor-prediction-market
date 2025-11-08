"use client"

import Link from "next/link"
import { CountdownTimer } from "@/components/common/CountdownTimer"
import { TradingButtons } from "@/components/trading/TradingButtons"
import {
  calculateMarketPrices,
  calculateMarketVolume,
} from "@/lib/utils/marketPrices"
import type { Market } from "@/types"

interface MarketCardProps {
  market: Market
  showTradingButtons?: boolean
  linkTo?: string
  className?: string
}

export function MarketCard({
  market,
  showTradingButtons = true,
  linkTo,
  className = "",
}: MarketCardProps) {
  // Computed values
  const { yesPricePercent, noPricePercent } = calculateMarketPrices(market)
  const totalVolume = calculateMarketVolume(market)
  const assetName = market.type === "PRICE" ? market.asset : "BNB/USDT"

  // Render helpers
  const renderTargetInfo = () => {
    if (market.type === "PRICE") {
      const targetPrice = (Number(market.targetPrice) / 1e8).toFixed(2)
      return (
        <div className="bg-white/[0.03] rounded-lg px-3 py-2 mb-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-white/50 font-medium">
              Target Price
            </span>
            <span className="text-sm text-white font-semibold">
              USD {targetPrice}
            </span>
          </div>
        </div>
      )
    }

    if (market.type === "LIQUIDITY") {
      const targetLiquidity = (Number(market.targetLiquidity) / 1e18).toFixed(2)
      return (
        <div className="bg-white/[0.03] rounded-lg px-3 py-2 mb-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-white/50 font-medium">
              Target Liquidity
            </span>
            <span className="text-sm text-white font-semibold">
              {targetLiquidity} BNB
            </span>
          </div>
        </div>
      )
    }

    return null
  }

  const cardContent = (
    <div
      className={`bg-gradient-to-br from-white/[0.07] to-white/[0.03] border border-white/10 backdrop-blur-xl p-5 rounded-2xl hover:from-white/[0.1] hover:to-white/[0.05] hover:border-white/20 transition-all duration-300 h-full flex flex-col shadow-lg ${className}`}
    >
      {/* Header: Asset badge and volume */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-primary uppercase px-3 py-1.5 bg-primary/20 rounded-lg border border-primary/30">
          {assetName}
        </span>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary/60"></div>
          <span className="text-xs text-white/60 font-medium">
            {totalVolume.toFixed(2)} BNB
          </span>
        </div>
      </div>

      {/* Market question */}
      <h3 className="text-base font-semibold text-white mb-4 line-clamp-2 leading-relaxed min-h-[3rem]">
        {market.description}
      </h3>

      {/* Target information */}
      {renderTargetInfo()}

      {/* Countdown timer */}
      <div className="mb-4 px-3 py-2 bg-white/[0.03] rounded-lg">
        <CountdownTimer
          targetDate={market.deadline * 1000}
          compact
          className="text-xs text-white/60 font-mono"
        />
      </div>

      {/* Action area: Trading buttons or view link */}
      <div className="mt-auto">
        {showTradingButtons ? (
          <TradingButtons market={market} />
        ) : (
          <div className="flex items-center justify-center gap-2 text-primary font-semibold text-sm hover:gap-3 transition-all py-3 px-4 bg-primary/10 rounded-xl hover:bg-primary/20 border border-primary/20">
            <span>View Market</span>
            <span className="text-base">→</span>
          </div>
        )}
      </div>
    </div>
  )

  // Wrap in Link if linkTo is provided and trading buttons are hidden
  if (linkTo && !showTradingButtons) {
    return (
      <Link href={linkTo} className="block h-full">
        {cardContent}
      </Link>
    )
  }

  return cardContent
}
