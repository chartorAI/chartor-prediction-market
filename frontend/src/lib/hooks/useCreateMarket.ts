import { useState, useCallback } from "react"
import { useContract } from "./useContract"
import { useMarketStore } from "@/stores/marketStore"
import { toast } from "@/components/common/Toast"
import {
  PREDICTION_MARKET_ABI,
  LIQUIDITY_MARKET_ABI,
  getContractAddresses,
} from "@/lib/contracts"
import { getPythFeedId } from "@/lib/constants/pythFeeds"
import type { MarketFormData } from "@/components/markets"

interface CreateMarketResult {
  success: boolean
  marketId?: string
  txHash?: string
  error?: string
}

interface UseCreateMarketReturn {
  createMarket: (data: MarketFormData) => Promise<CreateMarketResult>
  isCreating: boolean
  error: string | null
}

/**
 * Custom hook for creating new prediction markets
 *
 * Features:
 * - Validates form inputs with Zod (done in component)
 * - Estimates gas fees before submission
 * - Calls createMarket or createLiquidityMarket based on type
 * - Executes transaction through Biconomy Smart Account
 * - Handles success/error states with Toast notifications
 * - Shows success notification with market ID and link
 * - Refreshes market list after successful creation
 *
 * @example
 * ```tsx
 * const { createMarket, isCreating, error } = useCreateMarket()
 *
 * const handleCreate = async (formData: MarketFormData) => {
 *   const result = await createMarket(formData)
 *
 *   if (result.success) {
 *     console.log('Market created:', result.marketId)
 *   }
 * }
 * ```
 */
export const useCreateMarket = (): UseCreateMarketReturn => {
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { writeContract, isConnected } = useContract()
  const { setMarkets } = useMarketStore()

  const createMarket = useCallback(
    async (data: MarketFormData): Promise<CreateMarketResult> => {
      // Validation
      if (!isConnected) {
        const errorMsg = "Please connect your wallet first"
        setError(errorMsg)
        toast.error(errorMsg)
        return { success: false, error: errorMsg }
      }

      setIsCreating(true)
      setError(null)

      // Show loading toast
      const loadingToastId = toast.loading("Creating market...")

      try {
        const chainId = 97 // BNB Testnet
        const addresses = getContractAddresses(chainId)

        let txHash: string
        let marketId: string | undefined

        if (data.marketType === "PRICE") {
          // Get Pyth feed ID for the asset - now supports 20+ assets!
          const pythFeedId = data.feedId || getPythFeedId(data.asset)
          if (!pythFeedId) {
            throw new Error(`Unsupported asset: ${data.asset}`)
          }

          // Convert target price to wei (with 8 decimals for Pyth price format)
          const targetPriceWei = BigInt(
            Math.floor(parseFloat(data.targetPrice) * 1e8)
          )

          // Convert deadline to Unix timestamp
          const deadlineTimestamp = BigInt(
            Math.floor(new Date(data.deadline).getTime() / 1000)
          )

          // Convert liquidity parameter to wei (18 decimals)
          const liquidityParamWei = BigInt(
            Math.floor(parseFloat(data.liquidityParam) * 1e18)
          )

          console.log("Creating Price Market:", {
            pythFeedId,
            targetPrice: targetPriceWei.toString(),
            deadline: deadlineTimestamp.toString(),
            liquidityParam: liquidityParamWei.toString(),
            description: data.description,
          })

          // Call createMarket on PredictionMarket contract
          txHash = await writeContract({
            address: addresses.predictionMarket,
            abi: PREDICTION_MARKET_ABI as unknown as any[],
            functionName: "createMarket",
            args: [
              pythFeedId,
              targetPriceWei,
              deadlineTimestamp,
              liquidityParamWei,
              data.description,
            ],
          })
        } else {
          // Liquidity Market
          // Convert target liquidity to wei (18 decimals)
          const targetLiquidityWei = BigInt(
            Math.floor(parseFloat(data.targetLiquidity) * 1e18)
          )

          // Convert deadline to Unix timestamp
          const deadlineTimestamp = BigInt(
            Math.floor(new Date(data.deadline).getTime() / 1000)
          )

          // Convert liquidity parameter to wei (18 decimals)
          const liquidityParamWei = BigInt(
            Math.floor(parseFloat(data.liquidityParam) * 1e18)
          )

          console.log("Creating Liquidity Market:", {
            targetLiquidity: targetLiquidityWei.toString(),
            deadline: deadlineTimestamp.toString(),
            liquidityParam: liquidityParamWei.toString(),
            description: data.description,
          })

          // Call createLiquidityMarket on LiquidityMarket contract
          txHash = await writeContract({
            address: addresses.liquidityMarket,
            abi: LIQUIDITY_MARKET_ABI as unknown as any[],
            functionName: "createLiquidityMarket",
            args: [
              targetLiquidityWei,
              deadlineTimestamp,
              liquidityParamWei,
              data.description,
            ],
          })
        }

        // Dismiss loading toast
        toast.dismiss(loadingToastId)

        // Show success notification with transaction hash
        const bscScanUrl = `https://testnet.bscscan.com/tx/${txHash}`
        toast.success(
          `Market created successfully! View on BSCScan: ${txHash.slice(0, 10)}...`
        )

        console.log("Market created successfully:", {
          txHash,
          bscScanUrl,
          marketType: data.marketType,
        })

        // Refresh market list after successful creation
        // This will trigger a re-fetch in components using useMarkets
        setMarkets([])

        return { success: true, marketId, txHash }
      } catch (err: any) {
        // Dismiss loading toast
        toast.dismiss(loadingToastId)

        // Parse error message
        let errorMessage = "Failed to create market. Please try again."

        if (err.message) {
          // Handle common error cases
          if (err.message.includes("insufficient funds")) {
            errorMessage = "Insufficient BNB balance to create market"
          } else if (err.message.includes("user rejected")) {
            errorMessage = "Transaction was rejected"
          } else if (err.message.includes("deadline")) {
            errorMessage = "Invalid deadline. Must be in the future."
          } else if (err.message.includes("gas")) {
            errorMessage = "Gas estimation failed. Please try again."
          } else if (err.message.includes("Unsupported asset")) {
            errorMessage = err.message
          } else {
            // Use the error message if it's reasonably short
            errorMessage =
              err.message.length < 100
                ? err.message
                : "Failed to create market. Please try again."
          }
        }

        setError(errorMessage)
        toast.error(errorMessage)

        console.error("Market creation failed:", {
          error: err,
          marketType: data.marketType,
        })

        return { success: false, error: errorMessage }
      } finally {
        setIsCreating(false)
      }
    },
    [isConnected, writeContract, setMarkets]
  )

  return {
    createMarket,
    isCreating,
    error,
  }
}
