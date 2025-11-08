"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { useWhaleData, copyAddressToClipboard } from "@/lib/hooks/useWhaleData"
import { toast } from "@/components/common"
import type { Market } from "@/types"

interface WhaleTrackerProps {
  market: Market
  maxDisplay?: number
  className?: string
}

export function WhaleTracker({
  market,
  maxDisplay = 3,
  className,
}: WhaleTrackerProps) {
  const { whales, isLoading, hasWhales } = useWhaleData(market)
  const displayWhales = whales.slice(0, maxDisplay)

  if (isLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🐋</span>
          <h4 className="text-sm font-semibold text-text-primary">
            Whale Activity
          </h4>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 bg-glass-light animate-pulse rounded-lg"
            />
          ))}
        </div>
      </div>
    )
  }

  if (!hasWhales) {
    return (
      <div className={cn("", className)}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🐋</span>
          <h4 className="text-sm font-semibold text-text-primary">
            Whale Activity
          </h4>
        </div>
        <div className="p-4 rounded-lg bg-glass-light border border-border-subtle text-center">
          <p className="text-sm text-text-secondary">
            No whale bets yet. Be the first! 🐋
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("", className)}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🐋</span>
        <h4 className="text-sm font-semibold text-text-primary">
          Whale Activity
        </h4>
      </div>
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {displayWhales.map((whale, index) => (
            <WhaleBetCard
              key={`${whale.address}-${whale.timestamp}`}
              whale={whale}
              index={index}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

interface WhaleBetCardProps {
  whale: {
    address: string
    isYes: boolean
    amount: bigint
    formattedAmount: string
    formattedAddress: string
    timeAgo: string
  }
  index: number
}

function WhaleBetCard({ whale, index }: WhaleBetCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await copyAddressToClipboard(whale.address)
      setCopied(true)
      toast.success("Address copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Failed to copy address")
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="p-3 rounded-lg bg-glass-light border border-border-subtle hover:border-border-medium transition-all group"
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Address and Copy Button */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity"
            title="Click to copy address"
          >
            <span className="text-sm font-mono text-text-primary truncate">
              {whale.formattedAddress}
            </span>
            {copied ? (
              <Check className="w-3.5 h-3.5 text-success shrink-0" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            )}
          </button>
        </div>

        {/* Right: Amount, Position, and Time */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Amount */}
          <div className="text-right">
            <div className="text-sm font-bold text-text-primary font-mono">
              {whale.formattedAmount} BNB
            </div>
            <div className="text-xs text-text-secondary">{whale.timeAgo}</div>
          </div>

          {/* Position Indicator */}
          <div
            className={cn(
              "px-2 py-1 rounded text-xs font-bold min-w-[40px] text-center",
              whale.isYes
                ? "bg-success/20 text-success border border-success/30"
                : "bg-error/20 text-error border border-error/30"
            )}
          >
            {whale.isYes ? "YES" : "NO"}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
