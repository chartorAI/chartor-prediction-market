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
              <DialogTitle className="text-xl">
                Buy {isYes ? "YES" : "NO"} Shares
              </DialogTitle>
              <DialogDescription className="text-text-secondary">
                {market.description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-6">
              {/* Market Details */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-text-secondary">YES</div>
                    <div className="text-success font-semibold">
                      {yesPricePercent.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-text-secondary">NO</div>
                    <div className="text-error font-semibold">
                      {noPricePercent.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-text-secondary text-xs">
                    Market #{market.id}
                  </div>
                </div>
              </div>

              {/* Share Amount Input */}
              <div className="space-y-2">
                <label
                  htmlFor="shareAmount"
                  className="text-sm font-medium text-text-primary"
                >
                  Number of Shares
                </label>
                <Input
                  id="shareAmount"
                  type="number"
                  placeholder="Enter share amount"
                  value={shareAmount}
                  onChange={(e) => setShareAmount(e.target.value)}
                  disabled={isExecuting}
                  className="text-lg h-12"
                  min="0"
                  step="0.01"
                />
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-error text-sm"
                  >
                    {error}
                  </motion.p>
                )}
              </div>

              {/* Cost Breakdown */}
              {shareAmountBigInt > BigInt(0) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 p-4 rounded-lg bg-glass-light border border-border-subtle"
                >
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Share Cost</span>
                    <span className="text-text-primary font-medium">
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
                    <span className="text-text-secondary">Est. Gas Fee</span>
                    <span className="text-text-primary font-medium">
                      {formatBigInt(estimatedGasFee, 18, 4)} BNB
                    </span>
                  </div>
                  <div className="h-px bg-border-subtle" />
                  <div className="flex justify-between">
                    <span className="text-text-primary font-semibold">
                      Total Cost
                    </span>
                    <span className="text-primary font-bold text-lg">
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

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isExecuting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                variant={isYes ? "success" : "destructive"}
                onClick={handleConfirm}
                disabled={
                  isExecuting ||
                  !shareAmount ||
                  !!error ||
                  shareAmountBigInt <= BigInt(0) ||
                  isLoadingCost
                }
                className="w-full sm:w-auto min-w-[120px]"
              >
                {isExecuting ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  `Buy ${isYes ? "YES" : "NO"}`
                )}
              </Button>
            </DialogFooter>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
