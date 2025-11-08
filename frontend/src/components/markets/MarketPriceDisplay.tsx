"use client"

import { useMarketDetails } from "@/lib/hooks/useMarketDetails"
import type { Market } from "@/types"

interface MarketPriceDisplayProps {
  market: Market
  className?: string
}

/**
 * Component to display YES/NO prices fetched from the contract using LMSR
 */
export function MarketPriceDisplay({
  market,
  className = "",
}: MarketPriceDisplayProps) {
  const { details, isLoading } = useMarketDetails(market)

  // Calculate percentages from contract prices
  const yesPercent = details ? (Number(details.yesPrice) / 1e18) * 100 : 50
  const noPercent = details ? (Number(details.noPrice) / 1e18) * 100 : 50

  // Calculate volume
  const totalShares = Number(market.qYes + market.qNo) / 1e18

  if (isLoading) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <div className="flex-1 animate-pulse">
          <div className="h-4 bg-white/10 rounded mb-2" />
          <div className="h-6 bg-white/10 rounded" />
        </div>
        <div className="flex-1 animate-pulse">
          <div className="h-4 bg-white/10 rounded mb-2" />
          <div className="h-6 bg-white/10 rounded" />
        </div>
        <div className="flex-1 animate-pulse">
          <div className="h-4 bg-white/10 rounded mb-2" />
          <div className="h-6 bg-white/10 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex-1">
        <div className="text-xs text-white/60 mb-1">YES</div>
        <div className="text-lg font-bold text-success">
          {yesPercent.toFixed(1)}%
        </div>
      </div>
      <div className="flex-1">
        <div className="text-xs text-white/60 mb-1">NO</div>
        <div className="text-lg font-bold text-error">
          {noPercent.toFixed(1)}%
        </div>
      </div>
      <div className="flex-1 text-right">
        <div className="text-xs text-white/60 mb-1">Volume</div>
        <div className="text-sm font-semibold text-white">
          {totalShares.toFixed(2)} BNB
        </div>
      </div>
    </div>
  )
}
