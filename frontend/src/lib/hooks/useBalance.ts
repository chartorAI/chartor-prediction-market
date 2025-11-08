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
        const newBalance = await getBalance(
          web3AuthProvider,
          userAddress as Address
        )
        setBalance(newBalance)
      } catch (error) {
        console.error("Failed to fetch balance:", error)
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
