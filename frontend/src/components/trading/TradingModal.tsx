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
import { TrendingUp, TrendingDown, Info, Zap, ArrowRight } from "lucide-react"

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

interface TradingModalProps {
  isOpen: boolean
  onClose: () => void
  market: Market
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
  const chainId = 97
  const addresses = getContractAddresses(chainId)

  const isPriceMarket = market.type === "PRICE"
  const contractAddress = isPriceMarket
    ? addresses.predictionMarket
    : addresses.liquidityMarket
  const abi = isPriceMarket ? PREDICTION_MARKET_ABI : LIQUIDITY_MARKET_ABI

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
    watch: false, // Disabled auto-refresh for better UX
  })

  // Estimate gas fee (approximate)
  const estimatedGasFee = useMemo(() => {
    return BigInt(600000000000000)
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

    const tradeResult = await executeTrade({
      market,
      shares: shareAmountBigInt,
      isYes,
      cost: totalCost,
    })

    if (tradeResult.success) {
      onClose()
    }
  }

  const handleCancel = () => {
    if (!isExecuting) {
      onClose()
    }
  }

  // Quick amount presets
  const quickAmounts = [1, 5, 10, 25, 50]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden p-0 gap-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-slate-800/50 flex flex-col">
        {/* Header */}
        <div className="relative overflow-hidden px-6 pt-6 pb-4 bg-gradient-to-br from-primary/15 via-purple-600/15 to-transparent border-b border-white/10">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-full blur-3xl opacity-60" />

          <DialogHeader className="relative space-y-2">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-lg shadow-lg ${
                  isYes
                    ? "bg-gradient-to-br from-emerald-500 to-green-600"
                    : "bg-gradient-to-br from-rose-500 to-red-600"
                }`}
              >
                {isYes ? (
                  <TrendingUp className="w-4 h-4 text-white" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-white" />
                )}
              </div>
              <DialogTitle className="text-2xl font-bold text-white">
                Buy {isYes ? "YES" : "NO"} Shares
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-white/60 line-clamp-2">
              {market.description}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <div className="space-y-5">
            {/* Share Amount Input */}
            <div className="space-y-2.5">
              <label
                htmlFor="shareAmount"
                className="text-xs font-bold text-white/90 uppercase tracking-wide"
              >
                Number of Shares
              </label>
              <div className="relative">
                <Input
                  id="shareAmount"
                  type="number"
                  placeholder="Enter amount"
                  value={shareAmount}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === "" || /^\d+$/.test(value)) {
                      setShareAmount(value)
                    }
                  }}
                  disabled={isExecuting}
                  className="h-12 text-lg bg-slate-900/50 border-white/10 focus:border-primary/50 text-white font-semibold rounded-lg pr-20"
                  min="1"
                  step="1"
                  pattern="[0-9]*"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-sm font-medium">
                  shares
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-white/40 font-medium mr-1">
                  Quick:
                </span>
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setShareAmount(amount.toString())}
                    disabled={isExecuting}
                    className={`px-2.5 py-1 text-xs font-bold rounded transition-all ${
                      shareAmount === amount.toString()
                        ? "bg-primary text-white border border-primary"
                        : "bg-slate-800/50 text-white/60 border border-white/10 hover:border-primary/50 hover:text-white"
                    }`}
                  >
                    {amount}
                  </button>
                ))}
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs flex items-center gap-1.5 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20"
                >
                  <span className="w-1 h-1 bg-red-400 rounded-full" />
                  {error}
                </motion.p>
              )}

              <div className="flex items-center gap-2 text-xs text-white/50">
                <Info className="w-3 h-3" />
                <span>Whole numbers only (1, 2, 3, etc.)</span>
              </div>
            </div>

            {/* Cost Breakdown */}
            {shareAmountBigInt > BigInt(0) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-primary/10 to-purple-600/10 border border-primary/20"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-bold text-primary uppercase tracking-wide">
                    Cost Breakdown
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-sm">
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

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/60">Est. Gas Fee</span>
                    <span className="text-white font-semibold">
                      {formatBigInt(estimatedGasFee, 18, 4)} BNB
                    </span>
                  </div>

                  <div className="h-px bg-white/20 my-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold text-sm">
                      Total Cost
                    </span>
                    <div className="text-right">
                      {isLoadingCost ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <div className="text-primary font-bold text-lg">
                          {formatBigInt(totalCost, 18, 4)} BNB
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expected Return Info */}
                {costData && shareAmount && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="flex items-start gap-2 text-xs text-white/70">
                      <Info className="w-3.5 h-3.5 text-white/50 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="leading-relaxed">
                          If outcome is correct, you'll receive{" "}
                          <span className="text-white font-semibold">
                            {shareAmount} BNB
                          </span>
                        </p>
                        <p className="text-white/50 mt-1">
                          Potential profit:{" "}
                          <span className="text-emerald-400 font-semibold">
                            ~
                            {(
                              parseFloat(shareAmount) -
                              parseFloat(formatBigInt(totalCost, 18, 4))
                            ).toFixed(4)}{" "}
                            BNB
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900/50 border-t border-white/10 flex-shrink-0">
          <div className="flex gap-2.5">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isExecuting}
              className="flex-1 h-11 bg-slate-800/50 hover:bg-slate-800 border-slate-700 text-white font-semibold rounded-lg"
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
              className={`flex-[2] h-11 font-bold rounded-lg shadow-lg transition-all ${
                isYes
                  ? "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-emerald-500/30"
                  : "bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-rose-500/30"
              } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isExecuting ? (
                <div className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5">
                  <span>Buy {isYes ? "YES" : "NO"}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
