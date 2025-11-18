"use client"

import { cn } from "@/lib/utils/cn"
import { formatBigInt } from "@/lib/utils/format"
import { CountdownTimer } from "@/components/common/CountdownTimer"
import type { Position } from "@/types"

interface PositionCardProps {
  position: Position
  className?: string
}

export function PositionCard({ position, className }: PositionCardProps) {
  const { market } = position
  const isResolved = market.resolved
  const assetName = market.type === "PRICE" ? market.asset : "BNB/USDT"

  return (
    <div
      className={cn(
        "bg-gradient-to-br from-white/12 to-white/5 border border-white/10 backdrop-blur-xl p-4 rounded-2xl transition-all duration-300 shadow-lg",
        className
      )}
    >
      {/* Header: Asset badge and status */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-primary uppercase px-2 py-1 bg-primary/20 rounded-lg border border-primary/30">
          {assetName}
        </span>
        {isResolved && (
          <span
            className={cn(
              "text-xs font-semibold px-2 py-1 rounded-full",
              market.yesWins
                ? "bg-success/20 border border-success text-success"
                : "bg-error/20 border border-error text-error"
            )}
          >
            {market.yesWins ? "YES" : "NO"}
          </span>
        )}
      </div>

      {/* Market Description */}
      <h3 className="text-sm font-semibold text-white mb-3 line-clamp-2 leading-relaxed">
        {market.description}
      </h3>

      {/* Shares Owned */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-2 rounded-lg bg-white/5 border border-white/10">
          <div className="text-xs text-white/50 mb-1">YES</div>
          <div className="text-lg font-bold font-mono text-success/90">
            {formatBigInt(position.yesShares, 16, 2)}
          </div>
        </div>
        <div className="p-2 rounded-lg bg-white/5 border border-white/10">
          <div className="text-xs text-white/50 mb-1">NO</div>
          <div className="text-lg font-bold font-mono text-error/90">
            {formatBigInt(position.noShares, 16, 2)}
          </div>
        </div>
      </div>

      {/* Total Staked */}
      <div className="mb-2 px-3 py-2 bg-white/3 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/60">Staked</span>
          <span className="text-sm text-white font-mono font-semibold">
            {formatBigInt(position.totalStaked, 18, 4)} BNB
          </span>
        </div>
      </div>

      {/* Countdown or Resolution Status */}
      {!isResolved ? (
        <div className="px-3 py-2 bg-white/3 rounded-lg">
          <CountdownTimer
            targetDate={market.deadline * 1000}
            compact
            className="text-xs text-white/60 font-mono"
          />
        </div>
      ) : (
        <div className="px-3 py-2 bg-white/3 rounded-lg">
          <div className="text-xs text-white/60 text-center">Resolved</div>
        </div>
      )}
    </div>
  )
}
