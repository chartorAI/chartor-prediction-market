// Hook for fetching and managing user positions

import { useEffect, useState } from "react"
import { useReadContracts } from "wagmi"
import { useAuthStore } from "@/stores/authStore"
import {
  PREDICTION_MARKET_ABI,
  LIQUIDITY_MARKET_ABI,
  getContractAddresses,
} from "@/lib/contracts"
import { useMarkets } from "./useMarkets"
import type { Position, PositionWithPayout, Market } from "@/types"

const POLLING_INTERVAL = 10000 // 10 seconds

/**
 * Hook to fetch all user positions across all markets
 */
export function useUserPositions() {
  const { smartAccountAddress } = useAuthStore()
  const { allMarkets } = useMarkets()
  const chainId = 97 // BNB Testnet
  const addresses = getContractAddresses(chainId)

  const [positions, setPositions] = useState<Position[]>([])

  // Use smart account address
  const address = smartAccountAddress

  // Prepare contract calls to fetch positions for all markets
  const contracts = allMarkets.flatMap((market) => {
    const isPriceMarket = market.type === "PRICE"
    const contractAddress = isPriceMarket
      ? addresses.predictionMarket
      : addresses.liquidityMarket
    const abi = isPriceMarket ? PREDICTION_MARKET_ABI : LIQUIDITY_MARKET_ABI
    const marketId = BigInt(market.id)

    return [
      {
        address: contractAddress,
        abi,
        functionName: "getPosition" as const,
        args: [marketId, address as `0x${string}`],
      },
    ]
  })

  const { data, isLoading, refetch } = useReadContracts({
    contracts,
    query: {
      enabled: !!address && allMarkets.length > 0,
      refetchInterval: POLLING_INTERVAL,
    },
  })

  // Process position data
  useEffect(() => {
    if (!data || !address) {
      console.log("🔍 useUserPositions: No data or address", {
        data: !!data,
        address,
      })
      return
    }

    console.log("🔍 useUserPositions: Processing positions", {
      address,
      totalMarkets: allMarkets.length,
      dataLength: data.length,
    })

    const userPositions: Position[] = []

    allMarkets.forEach((market, index) => {
      const result = data[index]

      console.log(`📊 Market ${market.id}:`, {
        status: result?.status,
        hasResult: !!result?.result,
        result: result?.result,
      })

      if (result?.status === "success" && result.result) {
        const positionData = result.result as any

        console.log(`  Position data:`, {
          yesShares: positionData.yesShares?.toString(),
          noShares: positionData.noShares?.toString(),
          totalStaked: positionData.totalStaked?.toString(),
        })

        // Only include positions where user has shares
        if (
          positionData.yesShares > BigInt(0) ||
          positionData.noShares > BigInt(0)
        ) {
          const position: Position = {
            marketId: market.id,
            userAddress: address,
            yesShares: positionData.yesShares,
            noShares: positionData.noShares,
            totalStaked: positionData.totalStaked,
            market,
          }

          userPositions.push(position)
          console.log(`  ✅ Added position for market ${market.id}`)
        } else {
          console.log(`  ❌ No shares for market ${market.id}`)
        }
      }
    })

    console.log("📈 Total positions found:", userPositions.length)
    setPositions(userPositions)
  }, [data, allMarkets, address])

  // Filter positions by status
  const activePositions = positions.filter((p) => !p.market.resolved)
  const resolvedPositions = positions.filter((p) => p.market.resolved)

  return {
    positions,
    activePositions,
    resolvedPositions,
    isLoading,
    refetch,
    hasPositions: positions.length > 0,
  }
}

/**
 * Hook to fetch a single user position for a specific market
 */
export function useUserPosition(market: Market | null) {
  const { smartAccountAddress } = useAuthStore()
  const chainId = 97 // BNB Testnet
  const addresses = getContractAddresses(chainId)

  // Use smart account address
  const address = smartAccountAddress

  const isPriceMarket = market?.type === "PRICE"
  const contractAddress = isPriceMarket
    ? addresses.predictionMarket
    : addresses.liquidityMarket
  const abi = isPriceMarket ? PREDICTION_MARKET_ABI : LIQUIDITY_MARKET_ABI
  const marketId = market ? BigInt(market.id) : BigInt(0)

  const { data, isLoading, refetch } = useReadContracts({
    contracts:
      market && address
        ? [
            {
              address: contractAddress,
              abi,
              functionName: "getPosition" as const,
              args: [marketId, address as `0x${string}`],
            },
          ]
        : [],
    query: {
      enabled: !!market && !!address,
      refetchInterval: POLLING_INTERVAL,
    },
  })

  const position: Position | null =
    market && address && data?.[0]?.status === "success"
      ? {
          marketId: market.id,
          userAddress: address,
          yesShares: (data[0].result as any).yesShares,
          noShares: (data[0].result as any).noShares,
          totalStaked: (data[0].result as any).totalStaked,
          market,
        }
      : null

  const hasPosition =
    position &&
    (position.yesShares > BigInt(0) || position.noShares > BigInt(0))

  return {
    position,
    hasPosition,
    isLoading,
    refetch,
  }
}

/**
 * Hook to filter positions by active/resolved status
 */
export function useFilteredPositions(
  filter: "active" | "resolved" | "all" = "all"
) {
  const { positions, activePositions, resolvedPositions, isLoading } =
    useUserPositions()

  const filteredPositions =
    filter === "active"
      ? activePositions
      : filter === "resolved"
        ? resolvedPositions
        : positions

  return {
    positions: filteredPositions,
    count: filteredPositions.length,
    isLoading,
  }
}
