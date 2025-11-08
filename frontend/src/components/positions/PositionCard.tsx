"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils/cn"
import { formatBigInt, formatCountdown } from "@/lib/utils/format"
import { usePositionPayout } from "@/lib/hooks/usePositionPayout"
import type { Position } from "@/types"
import {
  TrendingUp,
  TrendingDown,
  Clock,
  ExternalLink,
  CheckCircle2,
  XCircle,
} from "lucide-react"

interface PositionCardProps {
  position: Position
  className?: string
}

export function PositionCard({ position, className }: PositionCardProps) {
  const { position: positionWithPayout, isLoading } =
    usePositionPayout(position)

  const { market } = position
  const isResolved = market.resolved

  // Format target value based on market type
  const targetValueDisplay =
    market.type === "PRICE"
      ? `${formatBigInt(market.targetPrice, 8, 2)}`
      : `${formatBigInt(market.targetLiquidity, 18, 2)} BNB`

  // Determine market link
  const marketLink =
    market.type === "PRICE"
      ? `/markets/price/${market.asset.toLowerCase()}`
      : `/markets/liquidity`

  // Calculate P&L color
  const profitLoss = positionWithPayout?.profitLoss || BigInt(0)
  const profitLossPercentage = positionWithPayout?.profitLossPercentage || 0
  const isProfitable = profitLoss > BigInt(0)
  const isBreakEven = profitLoss === BigInt(0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className={cn("glass-card p-6 relative overflow-hidden", className)}
    >
      {/* Resolved Badge with Outcome */}
      {isResolved && (
        <div
          className={cn(
            "absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold",
            market.yesWins
              ? "bg-success/20 border border-success text-success"
              : "bg-error/20 border border-error text-error"
          )}
        >
          {market.yesWins ? "YES Won" : "NO Won"}
        </div>
      )}

      {/* Market Description */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-text-primary mb-2 pr-20">
          {market.description}
        </h3>
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <span className="font-medium">Target:</span>
          <span className="text-text-primary font-mono">
            {targetValueDisplay}
          </span>
        </div>
      </div>

      {/* Shares Owned */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-success/10 border border-success/30">
          <div className="text-xs text-text-secondary mb-1">YES Shares</div>
          <div className="text-xl font-bold font-mono text-success">
            {formatBigInt(position.yesShares, 18, 2)}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-error/10 border border-error/30">
          <div className="text-xs text-text-secondary mb-1">NO Shares</div>
          <div className="text-xl font-bold font-mono text-error">
            {formatBigInt(position.noShares, 18, 2)}
          </div>
        </div>
      </div>

      {/* Staked and Payout */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Total Staked</span>
          <span className="text-text-primary font-mono font-medium">
            {formatBigInt(position.totalStaked, 18, 4)} BNB
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">
              {isResolved ? "Payout Received" : "Current Value"}
            </span>
            <div className="w-24 h-4 bg-glass-medium animate-pulse rounded" />
          </div>
        ) : (
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">
              {isResolved ? "Payout Received" : "Current Value"}
            </span>
            <span className="text-text-primary font-mono font-medium">
              {formatBigInt(
                positionWithPayout?.potentialPayout || BigInt(0),
                18,
                4
              )}{" "}
              BNB
            </span>
          </div>
        )}
      </div>

      {/* P&L Display */}
      {!isLoading && positionWithPayout && (
        <div
          className={cn(
            "p-4 rounded-lg border mb-4",
            isProfitable && "bg-success/10 border-success/30",
            !isProfitable && !isBreakEven && "bg-error/10 border-error/30",
            isBreakEven && "bg-glass-medium border-border-medium"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isProfitable && <TrendingUp className="w-5 h-5 text-success" />}
              {!isProfitable && !isBreakEven && (
                <TrendingDown className="w-5 h-5 text-error" />
              )}
              <span className="text-sm text-text-secondary">
                {isResolved ? "Final P&L" : "Profit/Loss"}
              </span>
            </div>
            <div className="text-right">
              <div
                className={cn(
                  "text-lg font-bold font-mono",
                  isProfitable && "text-success",
                  !isProfitable && !isBreakEven && "text-error",
                  isBreakEven && "text-text-primary"
                )}
              >
                {isProfitable && "+"}
                {formatBigInt(profitLoss, 18, 4)} BNB
              </div>
              <div
                className={cn(
                  "text-sm font-medium",
                  isProfitable && "text-success",
                  !isProfitable && !isBreakEven && "text-error",
                  isBreakEven && "text-text-secondary"
                )}
              >
                {isProfitable && "+"}
                {profitLossPercentage.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Winning/Losing Position Indicator for Resolved Markets */}
      {isResolved && !isLoading && positionWithPayout && (
        <div className="mb-4">
          {/* Check if user had winning shares */}
          {((market.yesWins && position.yesShares > BigInt(0)) ||
            (!market.yesWins && position.noShares > BigInt(0))) && (
            <div className="p-3 rounded-lg bg-success/10 border border-success/30 text-center">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <span className="text-success font-semibold">
                  You had winning shares!
                </span>
              </div>
              <div className="text-sm text-text-secondary mt-1">
                {market.yesWins
                  ? `${formatBigInt(position.yesShares, 18, 2)} YES shares`
                  : `${formatBigInt(position.noShares, 18, 2)} NO shares`}
              </div>
            </div>
          )}
          {/* Check if user only had losing shares */}
          {((market.yesWins &&
            position.yesShares === BigInt(0) &&
            position.noShares > BigInt(0)) ||
            (!market.yesWins &&
              position.noShares === BigInt(0) &&
              position.yesShares > BigInt(0))) && (
            <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-center">
              <div className="flex items-center justify-center gap-2">
                <XCircle className="w-5 h-5 text-error" />
                <span className="text-error font-semibold">
                  Your shares didn't win
                </span>
              </div>
              <div className="text-sm text-text-secondary mt-1">
                {market.yesWins
                  ? `${formatBigInt(position.noShares, 18, 2)} NO shares`
                  : `${formatBigInt(position.yesShares, 18, 2)} YES shares`}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Deadline or Resolution Info */}
      {!isResolved ? (
        <div className="flex items-center gap-2 mb-4 text-sm">
          <Clock className="w-4 h-4 text-text-secondary" />
          <span className="text-text-secondary">Ends in:</span>
          <span
            className={cn(
              "font-medium",
              market.deadline * 1000 - Date.now() < 3600000
                ? "text-error"
                : "text-text-primary"
            )}
          >
            {formatCountdown(market.deadline)}
          </span>
        </div>
      ) : (
        <div className="mb-4 p-3 rounded-lg bg-glass-medium border border-border-medium">
          <div className="text-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Market Outcome:</span>
              <span
                className={cn(
                  "font-bold",
                  market.yesWins ? "text-success" : "text-error"
                )}
              >
                {market.yesWins ? "YES" : "NO"}
              </span>
            </div>
            {market.type === "PRICE" && market.currentPrice && (
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Final Price:</span>
                <span className="text-text-primary font-mono">
                  ${(Number(market.currentPrice) / 1e8).toFixed(2)}
                </span>
              </div>
            )}
            {market.type === "LIQUIDITY" && market.currentLiquidity && (
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Final Liquidity:</span>
                <span className="text-text-primary font-mono">
                  {(Number(market.currentLiquidity) / 1e18).toFixed(2)} BNB
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Link to Market */}
      <Link
        href={marketLink}
        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-glass-medium hover:bg-glass-light border border-border-medium hover:border-primary transition-all text-text-primary text-sm font-medium group"
      >
        <span>View Market</span>
        <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </Link>
    </motion.div>
  )
}
