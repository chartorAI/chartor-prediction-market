// Hook for fetching and tracking whale bets with 15-second polling

import { useEffect, useState } from "react"
import { useReadContracts } from "wagmi"
import {
  PREDICTION_MARKET_ABI,
  LIQUIDITY_MARKET_ABI,
  getContractAddresses,
  type MarketWhales,
} from "@/lib/contracts"
import type { Market, WhaleBet } from "@/types"

const POLLING_INTERVAL = 15000 // 15 seconds

interface FormattedWhaleBet extends WhaleBet {
  marketId: string
  formattedAmount: string
  formattedAddress: string
  timeAgo: string
}

/**
 * Hook to fetch whale data for a single market with 15-second polling
 */
export function useWhaleData(market: Market | null) {
  const chainId = 97 // BNB Testnet
  const addresses = getContractAddresses(chainId)

  const [whales, setWhales] = useState<FormattedWhaleBet[]>([])
  const [previousWhales, setPreviousWhales] = useState<FormattedWhaleBet[]>([])

  const isPriceMarket = market?.type === "PRICE"
  const contractAddress = isPriceMarket
    ? addresses.predictionMarket
    : addresses.liquidityMarket
  const abi = isPriceMarket ? PREDICTION_MARKET_ABI : LIQUIDITY_MARKET_ABI
  const marketId = market ? BigInt(market.id) : BigInt(0)

  const { data, isLoading } = useReadContracts({
    contracts: market
      ? [
          {
            address: contractAddress,
            abi,
            functionName: "getCurrentWhales" as const,
            args: [marketId],
          },
        ]
      : [],
    query: {
      enabled: !!market,
      refetchInterval: POLLING_INTERVAL,
    },
  })

  // Process whale data
  useEffect(() => {
    if (!market || !data?.[0] || data[0].status !== "success") {
      setWhales([])
      return
    }

    const whaleData = data[0].result as unknown as MarketWhales
    const formattedWhales: FormattedWhaleBet[] = []

    // Add largest YES bet if it exists
    if (
      whaleData.largestYes.whale !==
      "0x0000000000000000000000000000000000000000"
    ) {
      formattedWhales.push({
        marketId: market.id,
        address: whaleData.largestYes.whale,
        isYes: true,
        amount: whaleData.largestYes.amount,
        timestamp: Number(whaleData.largestYes.timestamp),
        formattedAmount: formatAmount(whaleData.largestYes.amount),
        formattedAddress: formatAddress(whaleData.largestYes.whale),
        timeAgo: formatTimeAgo(Number(whaleData.largestYes.timestamp)),
      })
    }

    // Add largest NO bet if it exists
    if (
      whaleData.largestNo.whale !== "0x0000000000000000000000000000000000000000"
    ) {
      formattedWhales.push({
        marketId: market.id,
        address: whaleData.largestNo.whale,
        isYes: false,
        amount: whaleData.largestNo.amount,
        timestamp: Number(whaleData.largestNo.timestamp),
        formattedAmount: formatAmount(whaleData.largestNo.amount),
        formattedAddress: formatAddress(whaleData.largestNo.whale),
        timeAgo: formatTimeAgo(Number(whaleData.largestNo.timestamp)),
      })
    }

    // Sort by amount (largest first)
    formattedWhales.sort((a, b) => (a.amount > b.amount ? -1 : 1))

    // Check for new whales
    const hasNewWhales = formattedWhales.some(
      (whale) =>
        !previousWhales.some(
          (prev) =>
            prev.address === whale.address && prev.amount === whale.amount
        )
    )

    if (hasNewWhales) {
      setPreviousWhales(formattedWhales)
    }

    setWhales(formattedWhales)
  }, [data, market, previousWhales])

  return {
    whales,
    isLoading,
    hasWhales: whales.length > 0,
  }
}

/**
 * Hook to fetch whale data for multiple markets
 */
export function useWhalesData(markets: Market[]) {
  const chainId = 97 // BNB Testnet
  const addresses = getContractAddresses(chainId)

  const [whalesByMarket, setWhalesByMarket] = useState<
    Map<string, FormattedWhaleBet[]>
  >(new Map())

  // Prepare contract calls for all markets
  const contracts = markets.map((market) => {
    const isPriceMarket = market.type === "PRICE"
    const contractAddress = isPriceMarket
      ? addresses.predictionMarket
      : addresses.liquidityMarket
    const abi = isPriceMarket ? PREDICTION_MARKET_ABI : LIQUIDITY_MARKET_ABI
    const marketId = BigInt(market.id)

    return {
      address: contractAddress,
      abi,
      functionName: "getCurrentWhales" as const,
      args: [marketId],
    }
  })

  const { data, isLoading } = useReadContracts({
    contracts,
    query: {
      enabled: markets.length > 0,
      refetchInterval: POLLING_INTERVAL,
    },
  })

  // Process whale data for all markets
  useEffect(() => {
    if (!data || markets.length === 0) return

    const newWhalesByMarket = new Map<string, FormattedWhaleBet[]>()

    markets.forEach((market, index) => {
      const result = data[index]

      if (result?.status === "success") {
        const whaleData = result.result as unknown as MarketWhales
        const formattedWhales: FormattedWhaleBet[] = []

        // Add largest YES bet
        if (
          whaleData.largestYes.whale !==
          "0x0000000000000000000000000000000000000000"
        ) {
          formattedWhales.push({
            marketId: market.id,
            address: whaleData.largestYes.whale,
            isYes: true,
            amount: whaleData.largestYes.amount,
            timestamp: Number(whaleData.largestYes.timestamp),
            formattedAmount: formatAmount(whaleData.largestYes.amount),
            formattedAddress: formatAddress(whaleData.largestYes.whale),
            timeAgo: formatTimeAgo(Number(whaleData.largestYes.timestamp)),
          })
        }

        // Add largest NO bet
        if (
          whaleData.largestNo.whale !==
          "0x0000000000000000000000000000000000000000"
        ) {
          formattedWhales.push({
            marketId: market.id,
            address: whaleData.largestNo.whale,
            isYes: false,
            amount: whaleData.largestNo.amount,
            timestamp: Number(whaleData.largestNo.timestamp),
            formattedAmount: formatAmount(whaleData.largestNo.amount),
            formattedAddress: formatAddress(whaleData.largestNo.whale),
            timeAgo: formatTimeAgo(Number(whaleData.largestNo.timestamp)),
          })
        }

        // Sort by amount
        formattedWhales.sort((a, b) => (a.amount > b.amount ? -1 : 1))

        newWhalesByMarket.set(market.id, formattedWhales)
      }
    })

    setWhalesByMarket(newWhalesByMarket)
  }, [data, markets])

  return {
    whalesByMarket,
    isLoading,
    getWhalesForMarket: (marketId: string) =>
      whalesByMarket.get(marketId) || [],
  }
}

/**
 * Hook to get top N whale bets across all markets
 */
export function useTopWhales(markets: Market[], limit: number = 10) {
  const { whalesByMarket, isLoading } = useWhalesData(markets)

  const [topWhales, setTopWhales] = useState<FormattedWhaleBet[]>([])

  useEffect(() => {
    // Combine all whales from all markets
    const allWhales: FormattedWhaleBet[] = []

    whalesByMarket.forEach((whales) => {
      allWhales.push(...whales)
    })

    // Sort by amount and take top N
    const sorted = allWhales.sort((a, b) => (a.amount > b.amount ? -1 : 1))
    setTopWhales(sorted.slice(0, limit))
  }, [whalesByMarket, limit])

  return {
    topWhales,
    isLoading,
  }
}

// Helper functions

/**
 * Format BNB amount with 2 decimal precision
 */
function formatAmount(amount: bigint): string {
  const bnbAmount = Number(amount) / 1e18
  return bnbAmount.toFixed(2)
}

/**
 * Format wallet address (truncate with ellipsis)
 */
function formatAddress(address: string): string {
  if (address.length < 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

/**
 * Format timestamp as relative time
 */
function formatTimeAgo(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000)
  const secondsAgo = now - timestamp

  if (secondsAgo < 60) {
    return `${secondsAgo}s ago`
  } else if (secondsAgo < 3600) {
    const minutes = Math.floor(secondsAgo / 60)
    return `${minutes}m ago`
  } else if (secondsAgo < 86400) {
    const hours = Math.floor(secondsAgo / 3600)
    return `${hours}h ago`
  } else {
    const days = Math.floor(secondsAgo / 86400)
    return `${days}d ago`
  }
}

/**
 * Copy address to clipboard
 */
export function copyAddressToClipboard(address: string): Promise<void> {
  return navigator.clipboard.writeText(address)
}
