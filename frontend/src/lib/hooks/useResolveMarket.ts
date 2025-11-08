import { useState, useCallback } from "react"
import { toast } from "react-hot-toast"
import { useContract } from "./useContract"
import { getContractAddresses } from "../contracts/addresses"
import { PREDICTION_MARKET_ABI, LIQUIDITY_MARKET_ABI } from "../contracts/abis"
import type { Market } from "@/types"

interface UseResolveMarketReturn {
  resolveMarket: (market: Market) => Promise<void>
  isResolving: boolean
  error: string | null
}

export function useResolveMarket(): UseResolveMarketReturn {
  const [isResolving, setIsResolving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { writeContract, isConnected } = useContract()

  const resolveMarket = useCallback(
    async (market: Market) => {
      if (!isConnected) {
        toast.error("Please connect your wallet first")
        return
      }

      // Check if market deadline has passed
      const now = Date.now()
      const deadlineMs = market.deadline * 1000
      if (now < deadlineMs) {
        toast.error("Market deadline has not passed yet")
        return
      }

      setIsResolving(true)
      setError(null)

      const loadingToast = toast.loading("Resolving market...")

      try {
        const addresses = getContractAddresses(97) // BNB Testnet
        const contractAddress =
          market.type === "PRICE"
            ? addresses.predictionMarket
            : addresses.liquidityMarket
        const abi =
          market.type === "PRICE" ? PREDICTION_MARKET_ABI : LIQUIDITY_MARKET_ABI

        // Call resolveMarket function
        const txHash = await writeContract({
          address: contractAddress,
          abi: abi as any,
          functionName: "resolveMarket",
          args: [BigInt(market.id)],
        })

        toast.dismiss(loadingToast)
        toast.success(
          `Market resolved successfully! View transaction: https://testnet.bscscan.com/tx/${txHash}`,
          { duration: 5000 }
        )

        // Trigger a page reload to refresh market data
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } catch (err: any) {
        console.error("Error resolving market:", err)
        toast.dismiss(loadingToast)

        let errorMessage = "Failed to resolve market"
        if (err.message?.includes("user rejected")) {
          errorMessage = "Transaction rejected by user"
        } else if (err.message?.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for gas"
        } else if (err.message?.includes("Market not expired")) {
          errorMessage = "Market deadline has not passed yet"
        } else if (err.message?.includes("Already resolved")) {
          errorMessage = "Market has already been resolved"
        }

        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setIsResolving(false)
      }
    },
    [isConnected, writeContract]
  )

  return {
    resolveMarket,
    isResolving,
    error,
  }
}
