"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils/cn"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { MarketCard } from "./MarketCard"
import type { Market } from "@/types"
import type { Asset } from "@/lib/contracts"
import { useMarketsByAsset } from "@/lib/hooks/useMarkets"
import { TrendingUp } from "lucide-react"

interface MarketListProps {
  asset?: Asset
  markets?: Market[]
  showResolved?: boolean
  className?: string
}

export function MarketList({
  asset,
  markets: providedMarkets,
  showResolved = false,
  className,
}: MarketListProps) {
  // Fetch markets by asset if asset is provided
  const { markets: assetMarkets } = useMarketsByAsset(asset!)

  // Use provided markets or fetched markets
  const markets = providedMarkets || (asset ? assetMarkets : [])

  // Filter and sort markets
  const filteredMarkets = useMemo(() => {
    let filtered = markets

    // Filter out resolved markets if not showing them
    if (!showResolved) {
      filtered = filtered.filter((market) => {
        const isExpired = market.deadline * 1000 < Date.now()
        return !market.resolved && !isExpired
      })
    }

    // Sort by deadline (soonest first)
    return filtered.sort((a, b) => a.deadline - b.deadline)
  }, [markets, showResolved])

  // Loading state
  if (!markets) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" label="Loading markets..." />
      </div>
    )
  }

  // Empty state
  if (filteredMarkets.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex flex-col items-center justify-center py-16 px-4",
          className
        )}
      >
        <div className="glass-card p-8 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-glass-medium flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-text-secondary" />
          </div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            No Markets Available
          </h3>
          <p className="text-text-secondary">
            {showResolved
              ? "There are no resolved markets yet."
              : asset
                ? `No active markets for ${asset} at the moment. Check back soon!`
                : "No active markets at the moment. Check back soon!"}
          </p>
        </div>
      </motion.div>
    )
  }

  // Market grid
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-text-primary">
          {asset ? `${asset} Markets` : "Active Markets"}
        </h2>
        <span className="text-sm text-text-secondary">
          {filteredMarkets.length}{" "}
          {filteredMarkets.length === 1 ? "market" : "markets"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMarkets.map((market, index) => (
          <motion.div
            key={market.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <MarketCard market={market} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
