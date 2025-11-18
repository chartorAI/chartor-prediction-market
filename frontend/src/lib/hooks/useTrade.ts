import { useState, useCallback } from "react"
import { type Address } from "viem"
import { useContract } from "./useContract"
import { useMarketStore } from "@/stores/marketStore"
import { toast, transactionToast } from "@/components/common/Toast"
import {
  PREDICTION_MARKET_ABI,
  LIQUIDITY_MARKET_ABI,
  getContractAddresses,
} from "@/lib/contracts"
import type { Market } from "@/types"

interface TradeParams {
  market: Market
  shares: bigint
  isYes: boolean
  cost: bigint
}

interface TradeResult {
  success: boolean
  txHash?: string
  error?: string
}

interface UseTradeReturn {
  executeTrade: (params: TradeParams) => Promise<TradeResult>
  isExecuting: boolean
  error: string | null
}

/**
 * Custom hook for executing trades on prediction markets
 *
 * Features:
 * - Executes buyYesShares/buyNoShares through Biconomy Smart Account
 * - Handles transaction pending state with loading indicator
 * - Shows success notification with transaction hash
 * - Handles errors with user-friendly messages
 * - Refreshes market data after successful trade
 *
 */
export const useTrade = (): UseTradeReturn => {
  const [isExecuting, setIsExecuting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { writeContract, isConnected, smartAccount } = useContract()
  const { setMarkets } = useMarketStore()

  const executeTrade = useCallback(
    async ({
      market,
      shares,
      isYes,
      cost,
    }: TradeParams): Promise<TradeResult> => {
      // Validation
      if (!isConnected) {
        const errorMsg = "Please connect your wallet first"
        setError(errorMsg)
        toast.error(errorMsg)
        return { success: false, error: errorMsg }
      }

      if (shares <= BigInt(0)) {
        const errorMsg = "Share amount must be greater than 0"
        setError(errorMsg)
        toast.error(errorMsg)
        return { success: false, error: errorMsg }
      }

      if (cost <= BigInt(0)) {
        const errorMsg = "Invalid cost calculation"
        setError(errorMsg)
        toast.error(errorMsg)
        return { success: false, error: errorMsg }
      }

      const now = Math.floor(Date.now() / 1000)
      if (market.deadline < now) {
        const errorMsg = "This market has expired"
        setError(errorMsg)
        toast.error(errorMsg)
        return { success: false, error: errorMsg }
      }

      if (market.resolved) {
        const errorMsg = "This market has already been resolved"
        setError(errorMsg)
        toast.error(errorMsg)
        return { success: false, error: errorMsg }
      }

      setIsExecuting(true)
      setError(null)

      const loadingToastId = toast.loading(
        `Buying ${isYes ? "YES" : "NO"} shares...`
      )

      try {
        const chainId = 97
        const addresses = getContractAddresses(chainId)

        const isPriceMarket = market.type === "PRICE"
        const contractAddress = isPriceMarket
          ? addresses.predictionMarket
          : addresses.liquidityMarket
        const abi = isPriceMarket ? PREDICTION_MARKET_ABI : LIQUIDITY_MARKET_ABI

        const txHash = await writeContract({
          address: contractAddress,
          abi: abi as unknown as any[],
          functionName: isYes ? "buyYesShares" : "buyNoShares",
          args: [BigInt(market.id), shares],
          value: cost,
        })

        toast.dismiss(loadingToastId)

        // Show success notification with clickable transaction hash
        transactionToast.success(txHash)

        console.log("Trade executed successfully:", {
          txHash,
          bscScanUrl: `https://testnet.bscscan.com/tx/${txHash}`,
          market: market.id,
          shares: shares.toString(),
          isYes,
          cost: cost.toString(),
        })

        return { success: true, txHash }
      } catch (err: any) {
        toast.dismiss(loadingToastId)

        // Parse error message
        let errorMessage = "Transaction failed. Please try again."

        if (err.message) {
          // Handle common error cases
          if (err.message.includes("insufficient funds")) {
            errorMessage = "Insufficient BNB balance to complete this trade"
          } else if (err.message.includes("user rejected")) {
            errorMessage = "Transaction was rejected"
          } else if (err.message.includes("deadline")) {
            errorMessage = "Market deadline has passed"
          } else if (err.message.includes("resolved")) {
            errorMessage = "Market has already been resolved"
          } else if (err.message.includes("gas")) {
            errorMessage = "Gas estimation failed. Please try again."
          } else {
            errorMessage =
              err.message.length < 100
                ? err.message
                : "Transaction failed. Please try again."
          }
        }

        setError(errorMessage)
        toast.error(errorMessage)

        console.error("Trade execution failed:", {
          error: err,
          market: market.id,
          shares: shares.toString(),
          isYes,
          cost: cost.toString(),
        })

        return { success: false, error: errorMessage }
      } finally {
        setIsExecuting(false)
      }
    },
    [isConnected, writeContract, setMarkets]
  )

  return {
    executeTrade,
    isExecuting,
    error,
  }
}
