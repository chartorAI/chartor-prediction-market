"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { useTrade } from "@/lib/hooks/useTrade"
import { useContractRead } from "@/lib/hooks/useContractRead"
import {
  PREDICTION_MARKET_ABI,
  LIQUIDITY_MARKET_ABI,
  getContractAddresses,
} from "@/lib/contracts"
import { formatBigInt } from "@/lib/utils/format"
import type { Market } from "@/types"

// Validation schema for share amount
const shareAmountSchema = z
  .string()
  .min(1, "Share amount is required")
  .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Share amount must be a positive number",
  })
  .refine((val) => Number.isInteger(Number(val)), {
    message: "Share amount must be a whole number (no decimals)",
  })
  .refine((val) => Number(val) >= 1, {
    message: "Minimum purchase is 1 share",
  })
  .refine((val) => Number(val) <= 1000000, {
    message: "Share amount is too large",
  })

/**
 * TradingModal Component
 *
 * A modal dialog for executing trades on prediction markets.
 * Features:
 * - Real-time cost calculation using LMSR pricing from smart contract
 * - Input validation with Zod
 * - Gas fee estimation
 * - Animated transitions with Framer Motion
 * - Glassmorphism design
 * - Transaction execution through Biconomy Smart Account
 *
 * @example
 * ```tsx
 * <TradingModal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   market={selectedMarket}
 *   isYes={true}
 * />
 * ```
 */
interface TradingModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when modal should close */
  onClose: () => void
  /** The market to trade on */
  market: Market
  /** Whether trading YES (true) or NO (false) shares */
  isYes: boolean
}

export function TradingModal({
  isOpen,
  onClose,
  market,
  isYes,
}: TradingModalProps) {
  const [shareAmount, setShareAmount] = useState("")
  const [error, setError] = useState<string | null>(null)

  const { executeTrade, isExecuting } = useTrade()
  const chainId = 97 // BNB Testnet
  const addresses = getContractAddresses(chainId)

  // Determine contract details based on market type
  const isPriceMarket = market.type === "PRICE"
  const contractAddress = isPriceMarket
    ? addresses.predictionMarket
    : addresses.liquidityMarket
  const abi = isPriceMarket ? PREDICTION_MARKET_ABI : LIQUIDITY_MARKET_ABI

  // Parse share amount to BigInt (with 18 decimals)
  const shareAmountBigInt = useMemo(() => {
    try {
      if (!shareAmount || shareAmount === "") return BigInt(0)
      const parsed = parseFloat(shareAmount)
      if (isNaN(parsed) || parsed <= 0) return BigInt(0)
      return BigInt(Math.floor(parsed * 1e18))
    } catch {
      return BigInt(0)
    }
  }, [shareAmount])

  // Fetch cost calculation from contract
  const { data: costData, isLoading: isLoadingCost } = useContractRead<bigint>({
    address: contractAddress,
    abi: abi as unknown as any[],
    functionName: isYes ? "calculateYesCost" : "calculateNoCost",
    args: [BigInt(market.id), shareAmountBigInt],
    enabled: shareAmountBigInt > BigInt(0),
    watch: true,
    watchInterval: 2000,
  })

  // Estimate gas fee (approximate)
  const estimatedGasFee = useMemo(() => {
    // Rough estimate: 200,000 gas * 3 gwei = 0.0006 BNB
    return BigInt(600000000000000) // 0.0006 BNB in wei
  }, [])

  // Calculate total cost
  const totalCost = useMemo(() => {
    if (!costData) return BigInt(0)
    return costData + estimatedGasFee
  }, [costData, estimatedGasFee])

  // Validate input on change
  useEffect(() => {
    if (shareAmount === "") {
      setError(null)
      return
    }

    const result = shareAmountSchema.safeParse(shareAmount)
    if (!result.success) {
      setError(result.error.issues[0].message)
    } else {
      setError(null)
    }
  }, [shareAmount])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShareAmount("")
      setError(null)
    }
  }, [isOpen])

  const handleConfirm = async () => {
    // Validate
    const result = shareAmountSchema.safeParse(shareAmount)
    if (!result.success) {
      setError(result.error.issues[0].message)
      return
    }

    if (shareAmountBigInt <= BigInt(0)) {
      setError("Share amount must be greater than 0")
      return
    }

    if (!costData) {
      setError("Unable to calculate cost. Please try again.")
      return
    }

    // Execute trade using the useTrade hook
    const tradeResult = await executeTrade({
      market,
      shares: shareAmountBigInt,
      isYes,
      cost: totalCost,
    })

    // Close modal on success
    if (tradeResult.success) {
      onClose()
    }
  }

  const handleCancel = () => {
    if (!isExecuting) {
      onClose()
    }
  }

  // Get current prices for display
  const yesPrice = market.qYes > BigInt(0) ? Number(market.qYes) / 1e18 : 0
  const noPrice = market.qNo > BigInt(0) ? Number(market.qNo) / 1e18 : 0
  const yesPricePercent = yesPrice * 100
  const noPricePercent = noPrice * 100

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                Buy {isYes ? "YES" : "NO"} Shares
              </DialogTitle>
              <DialogDescription className="text-white/60 text-sm mt-2">
                {market.description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-4">
              {/* Market Details */}
              <div className="bg-gradient-to-br from-white/[0.12] to-white/[0.05] border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-white/50 text-xs mb-1">YES</div>
                      <div className="text-success font-bold text-lg">
                        {yesPricePercent.toFixed(1)}%
                      </div>
                    </div>
                    <div className="w-px h-10 bg-white/10"></div>
                    <div className="text-center">
                      <div className="text-white/50 text-xs mb-1">NO</div>
                      <div className="text-error font-bold text-lg">
                        {noPricePercent.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white/40 text-xs">
                      Market #{market.id}
                    </div>
                  </div>
                </div>
              </div>

              {/* Share Amount Input */}
              <div className="space-y-2">
                <label
                  htmlFor="shareAmount"
                  className="text-sm font-semibold text-white"
                >
                  Number of Shares
                </label>
                <Input
                  id="shareAmount"
                  type="number"
                  placeholder="Enter amount (e.g., 1, 2, 3...)"
                  value={shareAmount}
                  onChange={(e) => {
                    // Only allow integers
                    const value = e.target.value
                    if (value === "" || /^\d+$/.test(value)) {
                      setShareAmount(value)
                    }
                  }}
                  disabled={isExecuting}
                  className="text-lg h-12 bg-white/5 border-white/10 focus:border-primary/50 text-white"
                  min="1"
                  step="1"
                  pattern="[0-9]*"
                />
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-error text-sm font-medium"
                  >
                    {error}
                  </motion.p>
                )}
                <p className="text-xs text-white/50">
                  Whole numbers only (1, 2, 3, etc.)
                </p>
              </div>

              {/* Cost Breakdown */}
              {shareAmountBigInt > BigInt(0) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-white/[0.12] to-white/[0.05] border border-white/10"
                >
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Share Cost</span>
                    <span className="text-white font-semibold">
                      {isLoadingCost ? (
                        <LoadingSpinner size="sm" />
                      ) : costData ? (
                        `${formatBigInt(costData, 18, 4)} BNB`
                      ) : (
                        "—"
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Est. Gas Fee</span>
                    <span className="text-white font-semibold">
                      {formatBigInt(estimatedGasFee, 18, 4)} BNB
                    </span>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold">Total Cost</span>
                    <span className="text-primary font-bold text-xl">
                      {isLoadingCost ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        `${formatBigInt(totalCost, 18, 4)} BNB`
                      )}
                    </span>
                  </div>
                </motion.div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isExecuting}
                className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border-white/10 text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={
                  isExecuting ||
                  !shareAmount ||
                  !!error ||
                  shareAmountBigInt <= BigInt(0) ||
                  isLoadingCost
                }
                className={`w-full sm:w-auto min-w-[140px] font-bold ${
                  isYes
                    ? "bg-gradient-to-br from-success/80 to-success hover:from-success hover:to-success/80"
                    : "bg-gradient-to-br from-error/80 to-error hover:from-error hover:to-error/80"
                } text-white shadow-lg`}
              >
                {isExecuting ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  `Buy ${isYes ? "YES" : "NO"} Shares`
                )}
              </Button>
            </DialogFooter>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
