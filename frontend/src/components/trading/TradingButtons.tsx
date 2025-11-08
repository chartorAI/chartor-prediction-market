"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { TradingModal } from "./TradingModal"
import { useAuthStore } from "@/stores/authStore"
import type { Market } from "@/types"
import toast from "react-hot-toast"

/**
 * TradingButtons Component
 *
 * Displays prominent YES and NO trading buttons for a market.
 * Features:
 * - Color-coded buttons (green for YES, red for NO)
 * - Hover effects and animations with Framer Motion
 * - Opens TradingModal on click
 * - Disabled state for expired markets
 * - Loading state during transaction execution
 * - Authentication requirement
 *
 * @example
 * ```tsx
 * <TradingButtons market={market} isExecuting={false} />
 * ```
 */
interface TradingButtonsProps {
  /** The market to trade on */
  market: Market
  /** Whether a transaction is currently executing */
  isExecuting?: boolean
  /** Optional className for styling */
  className?: string
}

export function TradingButtons({
  market,
  isExecuting = false,
  className = "",
}: TradingButtonsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedIsYes, setSelectedIsYes] = useState(true)
  const { isAuthenticated } = useAuthStore()

  // Check if market is expired
  const isExpired = market.deadline * 1000 < Date.now()

  // Check if market is resolved
  const isResolved = market.resolved

  // Determine if buttons should be disabled
  const isDisabled = isExpired || isResolved || isExecuting

  const handleButtonClick = (isYes: boolean) => {
    // Require authentication
    if (!isAuthenticated) {
      toast.error("Please sign in to trade")
      return
    }

    // Prevent trading on expired markets
    if (isExpired) {
      toast.error("This market has expired")
      return
    }

    // Prevent trading on resolved markets
    if (isResolved) {
      toast.error("This market has been resolved")
      return
    }

    // Open modal with selected position
    setSelectedIsYes(isYes)
    setIsModalOpen(true)
  }

  return (
    <>
      <div className={`flex gap-3 ${className}`}>
        {/* YES Button */}
        <motion.div
          className="flex-1"
          whileHover={!isDisabled ? { scale: 1.02 } : {}}
          whileTap={!isDisabled ? { scale: 0.98 } : {}}
          transition={{ duration: 0.2 }}
        >
          <Button
            onClick={() => handleButtonClick(true)}
            disabled={isDisabled}
            className="w-full h-12 bg-success hover:bg-success/90 text-white font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            variant="default"
          >
            {isExecuting ? (
              <span className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                />
                Processing...
              </span>
            ) : (
              "YES"
            )}
          </Button>
        </motion.div>

        {/* NO Button */}
        <motion.div
          className="flex-1"
          whileHover={!isDisabled ? { scale: 1.02 } : {}}
          whileTap={!isDisabled ? { scale: 0.98 } : {}}
          transition={{ duration: 0.2 }}
        >
          <Button
            onClick={() => handleButtonClick(false)}
            disabled={isDisabled}
            className="w-full h-12 bg-error hover:bg-error/90 text-white font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            variant="default"
          >
            {isExecuting ? (
              <span className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                />
                Processing...
              </span>
            ) : (
              "NO"
            )}
          </Button>
        </motion.div>
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
