// Hook for fetching detailed market information

import { useReadContracts } from "wagmi"
import {
  PREDICTION_MARKET_ABI,
  LIQUIDITY_MARKET_ABI,
  getContractAddresses,
  type ResolutionStatus,
  type MarketWhales,
} from "@/lib/contracts"
import type { Market } from "@/types"

const POLLING_INTERVAL = 10000 // 10 seconds

interface MarketDetails {
  yesPrice: bigint
  noPrice: bigint
  participantCount: bigint
  marketBalance: bigint
  resolutionStatus: ResolutionStatus
  whales: MarketWhales
  currentPrice?: bigint // For price markets
  currentLiquidity?: bigint // For liquidity markets
}

/**
 * Hook to fetch detailed information for a specific market
 */
export function useMarketDetails(market: Market | null) {
  const chainId = 97 // BNB Testnet
  const addresses = getContractAddresses(chainId)

  const isPriceMarket = market?.type === "PRICE"
  const contractAddress = isPriceMarket
    ? addresses.predictionMarket
    : addresses.liquidityMarket
  const abi = isPriceMarket ? PREDICTION_MARKET_ABI : LIQUIDITY_MARKET_ABI

  const marketId = market ? BigInt(market.id) : 0n

  // Prepare contract calls
  const contracts = market
    ? [
        {
          address: contractAddress,
          abi,
          functionName: "getPriceYes" as const,
          args: [marketId],
        },
        {
          address: contractAddress,
          abi,
          functionName: "getPriceNo" as const,
          args: [marketId],
        },
        {
          address: contractAddress,
          abi,
          functionName: "getParticipantCount" as const,
          args: [marketId],
        },
        {
          address: contractAddress,
          abi,
          functionName: "getMarketBalance" as const,
          args: [marketId],
        },
        {
          address: contractAddress,
          abi,
          functionName: "getResolutionStatus" as const,
          args: [marketId],
        },
        {
          address: contractAddress,
          abi,
          functionName: "getCurrentWhales" as const,
          args: [marketId],
        },
        // Add current price for price markets
        ...(isPriceMarket
          ? [
              {
                address: contractAddress,
                abi: PREDICTION_MARKET_ABI,
                functionName: "getCurrentPrice" as const,
                args: [marketId],
              },
            ]
          : []),
        // Add current liquidity for liquidity markets
        ...(!isPriceMarket && market
          ? [
              {
                address: contractAddress,
                abi: LIQUIDITY_MARKET_ABI,
                functionName: "getCurrentLiquidity" as const,
                args: [],
              },
            ]
          : []),
      ]
    : []

  const { data, isLoading, error, refetch } = useReadContracts({
    contracts,
    query: {
      enabled: !!market,
      refetchInterval: POLLING_INTERVAL,
    },
  })

  // Process the results
  const marketDetails: MarketDetails | null =
    market && data ? processMarketDetails(data, isPriceMarket) : null

  return {
    details: marketDetails,
    isLoading,
    error,
    refetch,
  }
}

function processMarketDetails(
  data: any[],
  isPriceMarket: boolean
): MarketDetails | null {
  try {
    const [
      yesPriceResult,
      noPriceResult,
      participantResult,
      balanceResult,
      resolutionResult,
      whalesResult,
      ...rest
    ] = data

    if (
      yesPriceResult?.status !== "success" ||
      noPriceResult?.status !== "success" ||
      participantResult?.status !== "success" ||
      balanceResult?.status !== "success" ||
      resolutionResult?.status !== "success" ||
      whalesResult?.status !== "success"
    ) {
      return null
    }

    const details: MarketDetails = {
      yesPrice: yesPriceResult.result as bigint,
      noPrice: noPriceResult.result as bigint,
      participantCount: participantResult.result as bigint,
      marketBalance: balanceResult.result as bigint,
      resolutionStatus: {
        isResolved: (resolutionResult.result as any)[0],
        outcome: (resolutionResult.result as any)[1],
      },
      whales: whalesResult.result as MarketWhales,
    }

    // Add current price for price markets
    if (isPriceMarket && rest[0]?.status === "success") {
      const priceData = rest[0].result as any
      details.currentPrice = priceData[0] // First element is price
    }

    // Add current liquidity for liquidity markets
    if (!isPriceMarket && rest[0]?.status === "success") {
      details.currentLiquidity = rest[0].result as bigint
    }

    return details
  } catch (error) {
    console.error("Error processing market details:", error)
    return null
  }
}
