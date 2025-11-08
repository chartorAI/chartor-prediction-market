"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils/cn"
import { formatBigInt, formatNumber } from "@/lib/utils/format"
import { useMarketDetails } from "@/lib/hooks/useMarketDetails"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import type { Market } from "@/types"
import { TrendingUp, Users, Wallet, Droplets } from "lucide-react"

interface MarketStatsProps {
  market: Market
  className?: string
  variant?: "compact" | "detailed"
}

export function MarketStats({
  market,
  className,
  variant = "detailed",
}: MarketStatsProps) {
  const { details, isLoading } = useMarketDetails(market)

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-4", className)}>
        <LoadingSpinner size="sm" />
      </div>
    )
  }

  if (!details) {
    return null
  }

  // Calculate total volume (market balance)
  const totalVolume = details.marketBalance
  const participantCount = Number(details.participantCount)

  // Calculate liquidity depth (sum of YES and NO quantities)
  const liquidityDepth = market.qYes + market.qNo

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-4 text-sm", className)}>
        <StatItem
          icon={<TrendingUp className="w-4 h-4" />}
          label="Volume"
          value={`${formatBigInt(totalVolume, 18, 2)} BNB`}
        />
        <StatItem
          icon={<Users className="w-4 h-4" />}
          label="Participants"
          value={participantCount.toString()}
        />
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-lg font-semibold text-text-primary mb-3">
        Market Statistics
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Total Volume"
          value={formatBigInt(totalVolume, 18, 2)}
          unit="BNB"
          description="Total amount traded"
        />

        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Participants"
          value={participantCount.toString()}
          description="Unique traders"
        />

        <StatCard
          icon={<Wallet className="w-5 h-5" />}
          label="Market Balance"
          value={formatBigInt(details.marketBalance, 18, 2)}
          unit="BNB"
          description="Available for payouts"
        />

        <StatCard
          icon={<Droplets className="w-5 h-5" />}
          label="Liquidity Depth"
          value={formatNumber(Number(formatBigInt(liquidityDepth, 18, 0)))}
          unit="shares"
          description="Total shares issued"
        />
      </div>
    </div>
  )
}

interface StatItemProps {
  icon: React.ReactNode
  label: string
  value: string
}

function StatItem({ icon, label, value }: StatItemProps) {
  return (
    <div className="flex items-center gap-1.5 text-text-secondary">
      {icon}
      <span className="text-xs">{label}:</span>
      <span className="text-text-primary font-medium">{value}</span>
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  unit?: string
  description?: string
}

function StatCard({ icon, label, value, unit, description }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card p-4 hover:bg-glass-medium transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-text-secondary mb-1">{label}</div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-text-primary font-mono truncate">
              {value}
            </span>
            {unit && (
              <span className="text-sm text-text-secondary">{unit}</span>
            )}
          </div>
          {description && (
            <div className="text-xs text-text-secondary mt-1">
              {description}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
