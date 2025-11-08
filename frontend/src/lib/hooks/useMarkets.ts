// Hook for fetching and managing market data

import { useEffect, useCallback } from "react"
import { useReadContract, useReadContracts } from "wagmi"
import { useMarketStore } from "@/stores/marketStore"
import {
  PREDICTION_MARKET_ABI,
  LIQUIDITY_MARKET_ABI,
  getContractAddresses,
  getAssetFromFeedId,
  type Asset,
} from "@/lib/contracts"
import type { Market, PriceMarket, LiquidityMarket } from "@/types"

const POLLING_INTERVAL = 10000 // 10 seconds

/**
 * Hook to fetch all active markets from both contracts
 */
export function useMarkets() {
  const { markets, setMarkets, setLoading, setError, selectedMarketType } =
    useMarketStore()
  const chainId = 97 // BNB Testnet
  const addresses = getContractAddresses(chainId)

  // Fetch active market IDs from PredictionMarket
  const { data: priceMarketIds, isLoading: loadingPriceIds } = useReadContract({
    address: addresses.predictionMarket,
    abi: PREDICTION_MARKET_ABI,
    functionName: "getActiveMarkets",
    query: {
      refetchInterval: POLLING_INTERVAL,
    },
  })

  // Fetch active market IDs from LiquidityMarket
  const { data: liquidityMarketIds, isLoading: loadingLiquidityIds } =
    useReadContract({
      address: addresses.liquidityMarket,
      abi: LIQUIDITY_MARKET_ABI,
      functionName: "getActiveMarkets",
      query: {
        refetchInterval: POLLING_INTERVAL,
      },
    })

  // Fetch market details for price markets
  const priceMarketContracts =
    priceMarketIds?.map((id) => ({
      address: addresses.predictionMarket,
      abi: PREDICTION_MARKET_ABI,
      functionName: "getMarket" as const,
      args: [id],
    })) || []

  const { data: priceMarketData, isLoading: loadingPriceData } =
    useReadContracts({
      contracts: priceMarketContracts,
      query: {
        enabled: !!priceMarketIds && priceMarketIds.length > 0,
        refetchInterval: POLLING_INTERVAL,
      },
    })

  // Fetch market details for liquidity markets
  const liquidityMarketContracts =
    liquidityMarketIds?.map((id) => ({
      address: addresses.liquidityMarket,
      abi: LIQUIDITY_MARKET_ABI,
      functionName: "getMarket" as const,
      args: [id],
    })) || []

  const { data: liquidityMarketData, isLoading: loadingLiquidityData } =
    useReadContracts({
      contracts: liquidityMarketContracts,
      query: {
        enabled: !!liquidityMarketIds && liquidityMarketIds.length > 0,
        refetchInterval: POLLING_INTERVAL,
      },
    })

  // Process and combine market data
  useEffect(() => {
    const isLoading =
      loadingPriceIds ||
      loadingLiquidityIds ||
      loadingPriceData ||
      loadingLiquidityData
    setLoading(isLoading)

    if (isLoading) return

    try {
      const allMarkets: Market[] = []

      // Process price markets
      if (priceMarketIds && priceMarketData) {
        priceMarketIds.forEach((id, index) => {
          const result = priceMarketData[index]
          if (result?.status === "success" && result.result) {
            const config = result.result
            const asset = getAssetFromFeedId(config.pythFeedId)

            if (asset && config.exists) {
              const market: PriceMarket = {
                id: id.toString(),
                type: "PRICE",
                pythFeedId: config.pythFeedId,
                asset,
                targetPrice: config.targetPrice,
                deadline: Number(config.deadline),
                liquidityParam: config.liquidityParam,
                description: config.description,
                creator: config.creator,
                qYes: BigInt(0), // Will be fetched separately
                qNo: BigInt(0), // Will be fetched separately
                resolved: false, // Will be fetched separately
                yesWins: false,
              }
              allMarkets.push(market)
            }
          }
        })
      }

      // Process liquidity markets
      if (liquidityMarketIds && liquidityMarketData) {
        liquidityMarketIds.forEach((id, index) => {
          const result = liquidityMarketData[index]
          if (result?.status === "success" && result.result) {
            const config = result.result

            if (config.exists) {
              const market: LiquidityMarket = {
                id: id.toString(),
                type: "LIQUIDITY",
                poolAddress: addresses.liquidityMarket, // Pool address from contract
                targetLiquidity: config.targetLiquidity,
                deadline: Number(config.deadline),
                liquidityParam: config.liquidityParam,
                description: config.description,
                creator: config.creator,
                qYes: BigInt(0), // Will be fetched separately
                qNo: BigInt(0), // Will be fetched separately
                resolved: false, // Will be fetched separately
                yesWins: false,
              }
              allMarkets.push(market)
            }
          }
        })
      }

      setMarkets(allMarkets)
      setError(null)
    } catch (error) {
      console.error("Error processing market data:", error)
      setError("Failed to load markets")
    }
  }, [
    priceMarketIds,
    liquidityMarketIds,
    priceMarketData,
    liquidityMarketData,
    loadingPriceIds,
    loadingLiquidityIds,
    loadingPriceData,
    loadingLiquidityData,
    setMarkets,
    setLoading,
    setError,
    addresses.liquidityMarket,
  ])

  // Filter markets by type
  const filteredMarkets = markets.filter((m) => m.type === selectedMarketType)

  return {
    markets: filteredMarkets,
    allMarkets: markets,
    isLoading:
      loadingPriceIds ||
      loadingLiquidityIds ||
      loadingPriceData ||
      loadingLiquidityData,
    refetch: useCallback(() => {
      // Refetch will happen automatically due to polling
    }, []),
  }
}

/**
 * Hook to fetch markets for a specific asset
 */
export function useMarketsByAsset(asset: Asset) {
  const { markets } = useMarkets()

  const assetMarkets = markets.filter(
    (market) => market.type === "PRICE" && market.asset === asset
  )

  return {
    markets: assetMarkets,
    count: assetMarkets.length,
  }
}
