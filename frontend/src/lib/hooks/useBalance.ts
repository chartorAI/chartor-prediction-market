import { useEffect } from "react"
import { useAuthStore } from "@/stores/authStore"
import { getBalance } from "../web3/biconomy"
import type { Address } from "viem"

const BALANCE_REFRESH_INTERVAL = 10000 // 10 seconds

export function useBalance() {
  const {
    userAddress,
    web3AuthProvider,
    balance,
    setBalance,
    isAuthenticated,
  } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated || !userAddress || !web3AuthProvider) {
      return
    }

    const fetchBalance = async () => {
      try {
        console.log("=== FETCHING BALANCE ===")
        console.log("Address:", userAddress)
        console.log("Provider exists:", !!web3AuthProvider)

        const newBalance = await getBalance(
          web3AuthProvider,
          userAddress as Address
        )

        console.log("Balance fetched successfully:", newBalance.toString())
        console.log("Balance in BNB:", Number(newBalance) / 1e18)
        setBalance(newBalance)
      } catch (error) {
        console.error("=== BALANCE FETCH FAILED ===")
        console.error("Error:", error)
        console.error("Error details:", {
          message: (error as any)?.message,
          code: (error as any)?.code,
          data: (error as any)?.data,
        })
      }
    }

    // Fetch immediately
    fetchBalance()

    // Set up interval to refresh balance
    const intervalId = setInterval(fetchBalance, BALANCE_REFRESH_INTERVAL)

    return () => clearInterval(intervalId)
  }, [isAuthenticated, userAddress, web3AuthProvider, setBalance])

  return {
    balance,
    isLoading: balance === null && isAuthenticated,
  }
}
