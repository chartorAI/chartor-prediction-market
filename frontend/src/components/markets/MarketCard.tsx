"use client"

import Link from "next/link"
import { CountdownTimer } from "@/components/common/CountdownTimer"
import { TradingButtons } from "@/components/trading/TradingButtons"
import { useMarketDetails } from "@/lib/hooks/useMarketDetails"
import { useWhaleData } from "@/lib/hooks/useWhaleData"
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
  const { whales } = useWhaleData(market)
  const { details } = useMarketDetails(market)

  // Computed values
  const marketBalance = details?.marketBalance || BigInt(0)
  const assetName = market.type === "PRICE" ? market.asset : "LIQUIDITY"
  const isLiquidity = market.type === "LIQUIDITY"

  // Get YES and NO whales
  const yesWhale = whales.find((w) => w.isYes)
  const noWhale = whales.find((w) => !w.isYes)

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
      className={`bg-gradient-to-br backdrop-blur-xl p-5 rounded-2xl transition-all duration-300 h-full flex flex-col shadow-lg ${
        isLiquidity
          ? "from-purple-500/8 to-purple-600/3 border border-purple-500/15 hover:from-purple-500/10 hover:to-purple-600/5 hover:border-purple-500/25"
          : "from-white/12 to-white/5 border border-white/10 hover:from-white/15 hover:to-white/8 hover:border-white/20"
      } ${className}`}
    >
      {/* Header: Asset badge and volume */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-primary uppercase px-3 py-1.5 bg-primary/20 rounded-lg border border-primary/30">
            {assetName}
          </span>
          <span className="text-xs text-white/70 font-mono font-semibold">
            #{market.id}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary/60"></div>
          <span className="text-xs text-white/60 font-medium">
            {(Number(marketBalance) / 1e18).toFixed(4)} BNB
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
      <div className="mt-auto space-y-3">
        {showTradingButtons ? (
          <TradingButtons market={market} />
        ) : (
          <div className="flex items-center justify-center gap-2 text-primary font-semibold text-sm hover:gap-3 transition-all py-3 px-4 bg-primary/10 rounded-xl hover:bg-primary/20 border border-primary/20">
            <span>View Market</span>
            <span className="text-base">→</span>
          </div>
        )}

        {/* Whale Tracking - Inline Display (only show when trading buttons are visible) */}
        {showTradingButtons && (yesWhale || noWhale) && (
          <div className="space-y-1.5 pt-2 border-t border-white/5">
            {yesWhale && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-success/80 font-medium">YES Whale</span>
                <div className="flex items-center gap-2">
                  <span className="text-white/60 font-mono">
                    {yesWhale.formattedAddress}
                  </span>
                  <span className="text-white/80 font-semibold">
                    {yesWhale.formattedAmount} BNB
                  </span>
                </div>
              </div>
            )}
            {noWhale && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-error/80 font-medium">NO Whale</span>
                <div className="flex items-center gap-2">
                  <span className="text-white/60 font-mono">
                    {noWhale.formattedAddress}
                  </span>
                  <span className="text-white/80 font-semibold">
                    {noWhale.formattedAmount} BNB
                  </span>
                </div>
              </div>
            )}
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
