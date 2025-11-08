"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils/cn"
import { formatBigInt } from "@/lib/utils/format"
import { CountdownTimer } from "@/components/common/CountdownTimer"
import { TradingButtons } from "@/components/trading"
import { WhaleTracker } from "@/components/whales"
import { useMarketPrice } from "@/lib/hooks/useMarketPrices"
import { useMarketDetails } from "@/lib/hooks/useMarketDetails"
import { useResolveMarket } from "@/lib/hooks/useResolveMarket"
import { Button } from "@/components/ui/button"
import type { Market } from "@/types"
import { Clock, Users, TrendingUp, CheckCircle2 } from "lucide-react"

interface MarketCardProps {
  market: Market
  className?: string
}

export function MarketCard({ market, className }: MarketCardProps) {
  const { price, priceChange, isLoading: priceLoading } = useMarketPrice(market)
  const { details, isLoading: detailsLoading } = useMarketDetails(market)
  const { resolveMarket, isResolving } = useResolveMarket()

  const isExpired = market.deadline * 1000 < Date.now()
  const isResolved = details?.resolutionStatus.isResolved || false

  // Format target value based on market type
  const targetValueDisplay =
    market.type === "PRICE"
      ? `$${formatBigInt(market.targetPrice, 8, 2)}`
      : `${formatBigInt(market.targetLiquidity, 18, 2)} BNB`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className={cn("glass-card p-6 relative overflow-hidden", className)}
    >
      {/* Resolved Badge */}
      {isResolved && (
        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-primary/20 border border-primary text-primary text-xs font-semibold">
          Resolved
        </div>
      )}

      {/* Market Description */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          {market.description}
        </h3>
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <span className="font-medium">Target:</span>
          <span className="text-text-primary font-mono">
            {targetValueDisplay}
          </span>
        </div>
      </div>

      {/* YES/NO Prices */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <PriceDisplay
          label="YES"
          percentage={price?.yesPricePercent || 0}
          change={priceChange?.yesPriceChange}
          isLoading={priceLoading}
          variant="yes"
        />
        <PriceDisplay
          label="NO"
          percentage={price?.noPricePercent || 0}
          change={priceChange?.noPriceChange}
          isLoading={priceLoading}
          variant="no"
        />
      </div>

      {/* Market Stats */}
      <div className="flex items-center justify-between mb-4 text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-text-secondary">
            <TrendingUp className="w-4 h-4" />
            <span>
              {details
                ? `${formatBigInt(details.marketBalance, 18, 2)} BNB`
                : "..."}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-text-secondary">
            <Users className="w-4 h-4" />
            <span>{details ? details.participantCount.toString() : "..."}</span>
          </div>
        </div>
      </div>

      {/* Countdown Timer */}
      <div className="mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4 text-text-secondary" />
        <CountdownTimer
          targetDate={market.deadline * 1000}
          compact
          className={cn(
            "text-sm",
            !isExpired &&
              market.deadline * 1000 - Date.now() < 3600000 &&
              "text-error"
          )}
        />
      </div>

      {/* Whale Tracker */}
      <div className="mb-4">
        <WhaleTracker market={market} maxDisplay={3} />
      </div>

      {/* Trading Buttons or Resolve Button */}
      {!isResolved && !isExpired && <TradingButtons market={market} />}

      {/* Resolve Market Button */}
      {!isResolved && isExpired && (
        <Button
          onClick={() => resolveMarket(market)}
          disabled={isResolving}
          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold"
        >
          {isResolving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Resolving...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Resolve Market
            </>
          )}
        </Button>
      )}

      {/* Resolution Status */}
      {isResolved && details && (
        <div className="mt-4 p-4 rounded-lg bg-glass-medium border border-border-medium">
          <div className="space-y-2">
            <div className="text-center">
              <span className="text-sm text-text-secondary">Winner: </span>
              <span
                className={cn(
                  "text-lg font-bold",
                  details.resolutionStatus.outcome
                    ? "text-success"
                    : "text-error"
                )}
              >
                {details.resolutionStatus.outcome ? "YES" : "NO"}
              </span>
            </div>
            {market.type === "PRICE" && market.currentPrice && (
              <div className="text-center text-sm">
                <span className="text-text-secondary">Final Price: </span>
                <span className="text-text-primary font-mono font-medium">
                  ${(Number(market.currentPrice) / 1e8).toFixed(2)}
                </span>
              </div>
            )}
            {market.type === "LIQUIDITY" && market.currentLiquidity && (
              <div className="text-center text-sm">
                <span className="text-text-secondary">Final Liquidity: </span>
                <span className="text-text-primary font-mono font-medium">
                  {(Number(market.currentLiquidity) / 1e18).toFixed(2)} BNB
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}

interface PriceDisplayProps {
  label: string
  percentage: number
  change?: "up" | "down" | "none"
  isLoading: boolean
  variant: "yes" | "no"
}

function PriceDisplay({
  label,
  percentage,
  change,
  isLoading,
  variant,
}: PriceDisplayProps) {
  const color = variant === "yes" ? "text-success" : "text-error"
  const bgColor =
    variant === "yes"
      ? "bg-success/10 border-success/30"
      : "bg-error/10 border-error/30"

  return (
    <motion.div
      animate={
        change === "up"
          ? { scale: [1, 1.05, 1] }
          : change === "down"
            ? { scale: [1, 0.95, 1] }
            : {}
      }
      transition={{ duration: 0.3 }}
      className={cn("p-3 rounded-lg border transition-all", bgColor)}
    >
      <div className="text-xs text-text-secondary mb-1">{label}</div>
      {isLoading ? (
        <div className="h-7 flex items-center">
          <div className="w-12 h-4 bg-glass-medium animate-pulse rounded" />
        </div>
      ) : (
        <div className="flex items-baseline gap-1">
          <span className={cn("text-2xl font-bold font-mono", color)}>
            {percentage.toFixed(1)}
          </span>
          <span className={cn("text-sm", color)}>%</span>
        </div>
      )}
    </motion.div>
  )
}
