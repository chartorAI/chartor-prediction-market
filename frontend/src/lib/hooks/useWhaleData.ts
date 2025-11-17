import { useEffect, useState } from "react"
import { useReadContracts } from "wagmi"
import {
  PREDICTION_MARKET_ABI,
  LIQUIDITY_MARKET_ABI,
  getContractAddresses,
  type MarketWhales,
  type WhaleInfo,
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

  useEffect(() => {
    if (!market || !data?.[0] || data[0].status !== "success") {
      setWhales([])
      return
    }

    const result = data[0].result

    // Handle both array and object formats
    // Wagmi returns Solidity tuples as arrays [largestYes, largestNo]
    let whaleData: MarketWhales
    if (Array.isArray(result)) {
      whaleData = {
        largestYes: result[0] as WhaleInfo,
        largestNo: result[1] as WhaleInfo,
      }
    } else {
      whaleData = result as unknown as MarketWhales
    }

    if (!whaleData || !whaleData.largestYes || !whaleData.largestNo) {
      setWhales([])
      return
    }

    const formattedWhales: FormattedWhaleBet[] = []

    if (
      whaleData.largestYes.whale &&
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

    if (
      whaleData.largestNo.whale &&
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

  useEffect(() => {
    if (!data || markets.length === 0) return

    const newWhalesByMarket = new Map<string, FormattedWhaleBet[]>()

    markets.forEach((market, index) => {
      const result = data[index]

      if (result?.status === "success") {
        const resultData = result.result

        // Handle both array and object formats
        // Wagmi returns Solidity tuples as arrays [largestYes, largestNo]
        let whaleData: MarketWhales
        if (Array.isArray(resultData)) {
          whaleData = {
            largestYes: resultData[0] as WhaleInfo,
            largestNo: resultData[1] as WhaleInfo,
          }
        } else {
          whaleData = resultData as unknown as MarketWhales
        }

        if (!whaleData || !whaleData.largestYes || !whaleData.largestNo) {
          return
        }

        const formattedWhales: FormattedWhaleBet[] = []

        if (
          whaleData.largestYes.whale &&
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

        if (
          whaleData.largestNo.whale &&
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
    const allWhales: FormattedWhaleBet[] = []

    whalesByMarket.forEach((whales) => {
      allWhales.push(...whales)
    })

    const sorted = allWhales.sort((a, b) => (a.amount > b.amount ? -1 : 1))
    setTopWhales(sorted.slice(0, limit))
  }, [whalesByMarket, limit])

  return {
    topWhales,
    isLoading,
  }
}

/**
 * Format BNB amount with 4 decimal precision
 * Note: Whale amounts are in BNB (1e18), not shares
 */
function formatAmount(amount: bigint): string {
  const bnbAmount = Number(amount) / 1e18
  return bnbAmount.toFixed(4)
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
