"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import toast from "react-hot-toast"
import { TradingModal } from "./TradingModal"
import { useAuthStore } from "@/stores/authStore"
import { calculateMarketPrices } from "@/lib/utils/marketPrices"
import type { Market } from "@/types"

interface TradingButtonsProps {
  market: Market
  isExecuting?: boolean
  className?: string
}

export function TradingButtons({
  market,
  isExecuting = false,
  className = "",
}: TradingButtonsProps) {
  // State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedIsYes, setSelectedIsYes] = useState(true)
  const { isAuthenticated } = useAuthStore()

  // Market state checks
  const isExpired = market.deadline * 1000 < Date.now()
  const isResolved = market.resolved
  const isDisabled = isExpired || isResolved || isExecuting

  // Calculate prices
  const { yesPricePercent, noPricePercent } = calculateMarketPrices(market)

  // With 1e16 denomination: 1 share = 0.01 BNB payout
  const yesPriceBNB = (yesPricePercent / 100) * 0.01
  const noPriceBNB = (noPricePercent / 100) * 0.01

  // Handlers
  const handleButtonClick = (isYes: boolean) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to trade")
      return
    }

    if (isExpired) {
      toast.error("This market has expired")
      return
    }

    if (isResolved) {
      toast.error("This market has been resolved")
      return
    }

    setSelectedIsYes(isYes)
    setIsModalOpen(true)
  }

  // Render helpers
  const renderButtonContent = (
    label: string,
    price: number,
    percentage: number,
    isYesButton: boolean
  ) => {
    if (isExecuting) {
      return (
        <span className="flex items-center justify-center gap-1.5">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear",
            }}
            className={`w-3 h-3 border-2 ${
              isYesButton ? "border-white" : "border-white/50"
            } border-t-transparent rounded-full`}
          />
          <span className="text-xs">Processing...</span>
        </span>
      )
    }

    return (
      <div className="flex flex-col items-start gap-1 w-full">
        <div className="flex items-center justify-between w-full">
          <span className="font-semibold text-base">{label}</span>
          <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
        </div>
        <span className="text-xs opacity-80">{price.toFixed(4)} BNB</span>
      </div>
    )
  }

  return (
    <>
      <div className={`flex gap-3 ${className}`}>
        {/* YES Button */}
        <button
          onClick={() => handleButtonClick(true)}
          disabled={isDisabled}
          className="flex-1 px-4 py-3 bg-[#3F1A8F] hover:bg-[#4F2A9F] rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white"
        >
          {renderButtonContent("Yes", yesPriceBNB, yesPricePercent, true)}
        </button>

        {/* NO Button */}
        <button
          onClick={() => handleButtonClick(false)}
          disabled={isDisabled}
          className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white/70 hover:text-white"
        >
          {renderButtonContent("No", noPriceBNB, noPricePercent, false)}
        </button>
      </div>

      {/* Trading Modal */}
      <TradingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        market={market}
        isYes={selectedIsYes}
      />
    </>
  )
}
