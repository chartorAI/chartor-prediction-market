// Hook for fetching and managing market data

import { useEffect, useCallback, useMemo } from "react"
import { useReadContracts } from "wagmi"
import { useMarketStore } from "@/stores/marketStore"
import {
  PREDICTION_MARKET_ABI,
  LIQUIDITY_MARKET_ABI,
  getContractAddresses,
  getAssetFromFeedId,
} from "@/lib/contracts"
import type { Market, PriceMarket, LiquidityMarket, Asset } from "@/types"

const POLLING_INTERVAL = 10000 // 10 seconds

/**
 * Hook to fetch all active markets from both contracts
 */
export function useMarkets() {
  const { markets, setMarkets, setLoading, setError, selectedMarketType } =
    useMarketStore()
  const chainId = 97 // BNB Testnet
  const addresses = getContractAddresses(chainId)

  // Fetch active, resolved, and expired market IDs from both contracts
  const { data: priceMarketData, isLoading: loadingPriceIds } =
    useReadContracts({
      contracts: [
        {
          address: addresses.predictionMarket,
          abi: PREDICTION_MARKET_ABI,
          functionName: "getActiveMarkets",
        },
        {
          address: addresses.predictionMarket,
          abi: PREDICTION_MARKET_ABI,
          functionName: "getResolvedMarkets",
        },
        {
          address: addresses.predictionMarket,
          abi: PREDICTION_MARKET_ABI,
          functionName: "getExpiredUnresolvedMarkets",
        },
      ],
      query: {
        refetchInterval: POLLING_INTERVAL,
      },
    })

  const { data: liquidityMarketData, isLoading: loadingLiquidityIds } =
    useReadContracts({
      contracts: [
        {
          address: addresses.liquidityMarket,
          abi: LIQUIDITY_MARKET_ABI,
          functionName: "getActiveMarkets",
        },
        {
          address: addresses.liquidityMarket,
          abi: LIQUIDITY_MARKET_ABI,
          functionName: "getResolvedMarkets",
        },
        {
          address: addresses.liquidityMarket,
          abi: LIQUIDITY_MARKET_ABI,
          functionName: "getExpiredUnresolvedMarkets",
        },
      ],
      query: {
        refetchInterval: POLLING_INTERVAL,
      },
    })

  // Combine all market IDs (active, resolved, expired) - memoized to prevent infinite loops
  // Use Set to remove duplicates in case a market appears in multiple categories
  const priceMarketIds = useMemo(() => {
    const active = (priceMarketData?.[0]?.result as bigint[]) || []
    const resolved = (priceMarketData?.[1]?.result as bigint[]) || []
    const expired = (priceMarketData?.[2]?.result as bigint[]) || []
    const ids = [...active, ...resolved, ...expired]
    // Remove duplicates by converting to Set and back
    return Array.from(new Set(ids.map((id) => id.toString()))).map((id) =>
      BigInt(id)
    )
  }, [
    priceMarketData?.[0]?.result,
    priceMarketData?.[1]?.result,
    priceMarketData?.[2]?.result,
  ])

  const liquidityMarketIds = useMemo(() => {
    const active = (liquidityMarketData?.[0]?.result as bigint[]) || []
    const resolved = (liquidityMarketData?.[1]?.result as bigint[]) || []
    const expired = (liquidityMarketData?.[2]?.result as bigint[]) || []
    const ids = [...active, ...resolved, ...expired]
    // Remove duplicates by converting to Set and back
    return Array.from(new Set(ids.map((id) => id.toString()))).map((id) =>
      BigInt(id)
    )
  }, [
    liquidityMarketData?.[0]?.result,
    liquidityMarketData?.[1]?.result,
    liquidityMarketData?.[2]?.result,
  ])

  // Fetch total market counts from both contracts
  const { data: marketCounts } = useReadContracts({
    contracts: [
      {
        address: addresses.predictionMarket,
        abi: PREDICTION_MARKET_ABI,
        functionName: "getMarketCount",
      },
      {
        address: addresses.liquidityMarket,
        abi: LIQUIDITY_MARKET_ABI,
        functionName: "getMarketCount",
      },
    ],
    query: {
      refetchInterval: POLLING_INTERVAL,
    },
  })

  const totalMarketCount =
    Number(marketCounts?.[0]?.result || 0) +
    Number(marketCounts?.[1]?.result || 0)

  const priceMarketContracts = useMemo(
    () =>
      priceMarketIds.flatMap((id) => [
        {
          address: addresses.predictionMarket,
          abi: PREDICTION_MARKET_ABI,
          functionName: "getMarket" as const,
          args: [id],
        },
        {
          address: addresses.predictionMarket,
          abi: PREDICTION_MARKET_ABI,
          functionName: "qYes" as const,
          args: [id],
        },
        {
          address: addresses.predictionMarket,
          abi: PREDICTION_MARKET_ABI,
          functionName: "qNo" as const,
          args: [id],
        },
        {
          address: addresses.predictionMarket,
          abi: PREDICTION_MARKET_ABI,
          functionName: "resolved" as const,
          args: [id],
        },
      ]),
    [priceMarketIds, addresses.predictionMarket]
  )

  const { data: priceMarketDetailsData, isLoading: loadingPriceData } =
    useReadContracts({
      contracts: priceMarketContracts,
      query: {
        enabled: priceMarketIds.length > 0,
        refetchInterval: POLLING_INTERVAL,
      },
    })

  // Fetch market details for liquidity markets (config, qYes, qNo, resolved)
  const liquidityMarketContracts = useMemo(
    () =>
      liquidityMarketIds.flatMap((id) => [
        {
          address: addresses.liquidityMarket,
          abi: LIQUIDITY_MARKET_ABI,
          functionName: "getMarket" as const,
          args: [id],
        },
        {
          address: addresses.liquidityMarket,
          abi: LIQUIDITY_MARKET_ABI,
          functionName: "qYes" as const,
          args: [id],
        },
        {
          address: addresses.liquidityMarket,
          abi: LIQUIDITY_MARKET_ABI,
          functionName: "qNo" as const,
          args: [id],
        },
        {
          address: addresses.liquidityMarket,
          abi: LIQUIDITY_MARKET_ABI,
          functionName: "resolved" as const,
          args: [id],
        },
      ]),
    [liquidityMarketIds, addresses.liquidityMarket]
  )

  const { data: liquidityMarketDetailsData, isLoading: loadingLiquidityData } =
    useReadContracts({
      contracts: liquidityMarketContracts,
      query: {
        enabled: liquidityMarketIds.length > 0,
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

    if (isLoading) {
      setLoading(true)
      return
    }

    setLoading(false)

    try {
      const allMarkets: Market[] = []

      // Process price markets (each market has 4 contract calls: config, qYes, qNo, resolved)
      if (priceMarketIds.length > 0 && priceMarketDetailsData) {
        priceMarketIds.forEach((id, index) => {
          const baseIndex = index * 4
          const configResult = priceMarketDetailsData[baseIndex]
          const qYesResult = priceMarketDetailsData[baseIndex + 1]
          const qNoResult = priceMarketDetailsData[baseIndex + 2]
          const resolvedResult = priceMarketDetailsData[baseIndex + 3]

          if (
            configResult?.status === "success" &&
            configResult.result &&
            qYesResult?.status === "success" &&
            qNoResult?.status === "success" &&
            resolvedResult?.status === "success"
          ) {
            const config = configResult.result as {
              pythFeedId: `0x${string}`
              targetPrice: bigint
              deadline: bigint
              liquidityParam: bigint
              description: string
              creator: `0x${string}`
              exists: boolean
            }
            const asset = getAssetFromFeedId(config.pythFeedId)

            if (asset && config.exists) {
              const market: PriceMarket = {
                id: id.toString(),
                type: "PRICE",
                pythFeedId: config.pythFeedId,
                asset: asset as Asset,
                targetPrice: config.targetPrice,
                deadline: Number(config.deadline),
                liquidityParam: config.liquidityParam,
                description: config.description,
                creator: config.creator,
                qYes: qYesResult.result as bigint,
                qNo: qNoResult.result as bigint,
                resolved: resolvedResult.result as boolean,
                yesWins: false,
              }
              allMarkets.push(market)
            }
          }
        })
      }

      // Process liquidity markets (each market has 4 contract calls: config, qYes, qNo, resolved)
      if (liquidityMarketIds.length > 0 && liquidityMarketDetailsData) {
        liquidityMarketIds.forEach((id, index) => {
          const baseIndex = index * 4
          const configResult = liquidityMarketDetailsData[baseIndex]
          const qYesResult = liquidityMarketDetailsData[baseIndex + 1]
          const qNoResult = liquidityMarketDetailsData[baseIndex + 2]
          const resolvedResult = liquidityMarketDetailsData[baseIndex + 3]

          if (
            configResult?.status === "success" &&
            configResult.result &&
            qYesResult?.status === "success" &&
            qNoResult?.status === "success" &&
            resolvedResult?.status === "success"
          ) {
            const config = configResult.result as {
              targetLiquidity: bigint
              deadline: bigint
              liquidityParam: bigint
              description: string
              creator: `0x${string}`
              exists: boolean
            }

            if (config.exists) {
              const market: LiquidityMarket = {
                id: id.toString(),
                type: "LIQUIDITY",
                poolAddress: addresses.liquidityMarket,
                targetLiquidity: config.targetLiquidity,
                deadline: Number(config.deadline),
                liquidityParam: config.liquidityParam,
                description: config.description,
                creator: config.creator,
                qYes: qYesResult.result as bigint,
                qNo: qNoResult.result as bigint,
                resolved: resolvedResult.result as boolean,
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
    priceMarketDetailsData,
    liquidityMarketDetailsData,
    loadingPriceIds,
    loadingLiquidityIds,
    loadingPriceData,
    loadingLiquidityData,
    setMarkets,
    setError,
    setLoading,
    addresses.liquidityMarket,
  ])

  // Fetch total contract balances for volume calculation
  const { data: contractBalances } = useReadContracts({
    contracts: [
      {
        address: addresses.predictionMarket,
        abi: PREDICTION_MARKET_ABI,
        functionName: "getContractBalance",
      },
      {
        address: addresses.liquidityMarket,
        abi: LIQUIDITY_MARKET_ABI,
        functionName: "getContractBalance",
      },
    ],
    query: {
      refetchInterval: POLLING_INTERVAL,
    },
  })

  const totalVolume =
    (contractBalances?.[0]?.status === "success"
      ? (contractBalances[0].result as bigint)
      : BigInt(0)) +
    (contractBalances?.[1]?.status === "success"
      ? (contractBalances[1].result as bigint)
      : BigInt(0))

  // Filter markets by type
  const filteredMarkets = markets.filter((m) => m.type === selectedMarketType)

  return {
    markets: filteredMarkets,
    allMarkets: markets,
    totalMarketCount,
    totalVolume,
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
