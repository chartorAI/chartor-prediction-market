// Hook for fetching YES/NO prices with 10-second polling

import { useEffect, useState } from "react"
import { useReadContracts } from "wagmi"
import {
  PREDICTION_MARKET_ABI,
  LIQUIDITY_MARKET_ABI,
  getContractAddresses,
} from "@/lib/contracts"
import type { Market } from "@/types"

const POLLING_INTERVAL = 10000 // 10 seconds

interface MarketPrice {
  marketId: string
  yesPrice: bigint
  noPrice: bigint
  yesPricePercent: number
  noPricePercent: number
  lastUpdated: number
}

interface PriceChange {
  marketId: string
  yesPriceChange: "up" | "down" | "none"
  noPriceChange: "up" | "down" | "none"
}

/**
 * Hook to fetch and track YES/NO prices for multiple markets with 10-second polling
 */
export function useMarketPrices(markets: Market[]) {
  const chainId = 97 // BNB Testnet
  const addresses = getContractAddresses(chainId)

  const [prices, setPrices] = useState<Map<string, MarketPrice>>(new Map())
  const [priceChanges, setPriceChanges] = useState<Map<string, PriceChange>>(
    new Map()
  )

  // Prepare contract calls for all markets
  const contracts = markets.flatMap((market) => {
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
        functionName: "getPriceYes" as const,
        args: [marketId],
      },
      {
        address: contractAddress,
        abi,
        functionName: "getPriceNo" as const,
        args: [marketId],
      },
    ]
  })

  const { data, isLoading } = useReadContracts({
    contracts,
    query: {
      enabled: markets.length > 0,
      refetchInterval: POLLING_INTERVAL,
    },
  })

  // Process price data and track changes
  useEffect(() => {
    if (!data || markets.length === 0) return

    const newPrices = new Map<string, MarketPrice>()
    const newPriceChanges = new Map<string, PriceChange>()

    markets.forEach((market, index) => {
      const yesPriceResult = data[index * 2]
      const noPriceResult = data[index * 2 + 1]

      if (
        yesPriceResult?.status === "success" &&
        noPriceResult?.status === "success"
      ) {
        const yesPrice = yesPriceResult.result as bigint
        const noPrice = noPriceResult.result as bigint

        // Calculate percentages (prices are in 18 decimals, representing 0-1)
        const yesPricePercent = (Number(yesPrice) / 1e18) * 100
        const noPricePercent = (Number(noPrice) / 1e18) * 100

        const newPrice: MarketPrice = {
          marketId: market.id,
          yesPrice,
          noPrice,
          yesPricePercent,
          noPricePercent,
          lastUpdated: Date.now(),
        }

        newPrices.set(market.id, newPrice)

        // Track price changes
        const oldPrice = prices.get(market.id)
        if (oldPrice) {
          const yesPriceChange =
            yesPrice > oldPrice.yesPrice
              ? "up"
              : yesPrice < oldPrice.yesPrice
                ? "down"
                : "none"
          const noPriceChange =
            noPrice > oldPrice.noPrice
              ? "up"
              : noPrice < oldPrice.noPrice
                ? "down"
                : "none"

          newPriceChanges.set(market.id, {
            marketId: market.id,
            yesPriceChange,
            noPriceChange,
          })
        }
      }
    })

    setPrices(newPrices)
    setPriceChanges(newPriceChanges)
  }, [data, markets])

  return {
    prices: Array.from(prices.values()),
    priceChanges: Array.from(priceChanges.values()),
    isLoading,
    getPriceForMarket: (marketId: string) => prices.get(marketId),
    getPriceChangeForMarket: (marketId: string) => priceChanges.get(marketId),
  }
}

/**
 * Hook to fetch prices for a single market
 */
export function useMarketPrice(market: Market | null) {
  const chainId = 97 // BNB Testnet
  const addresses = getContractAddresses(chainId)

  const [previousPrice, setPreviousPrice] = useState<{
    yesPrice: bigint
    noPrice: bigint
  } | null>(null)

  const isPriceMarket = market?.type === "PRICE"
  const contractAddress = isPriceMarket
    ? addresses.predictionMarket
    : addresses.liquidityMarket
  const abi = isPriceMarket ? PREDICTION_MARKET_ABI : LIQUIDITY_MARKET_ABI
  const marketId = market ? BigInt(market.id) : 0n

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
      ]
    : []

  const { data, isLoading } = useReadContracts({
    contracts,
    query: {
      enabled: !!market,
      refetchInterval: POLLING_INTERVAL,
    },
  })

  // Process and track price changes
  const price: MarketPrice | null =
    market && data?.[0]?.status === "success" && data?.[1]?.status === "success"
      ? {
          marketId: market.id,
          yesPrice: data[0].result as bigint,
          noPrice: data[1].result as bigint,
          yesPricePercent: (Number(data[0].result as bigint) / 1e18) * 100,
          noPricePercent: (Number(data[1].result as bigint) / 1e18) * 100,
          lastUpdated: Date.now(),
        }
      : null

  // Track price changes
  useEffect(() => {
    if (price && previousPrice) {
      // Price changed, update previous
      if (
        price.yesPrice !== previousPrice.yesPrice ||
        price.noPrice !== previousPrice.noPrice
      ) {
        setPreviousPrice({
          yesPrice: price.yesPrice,
          noPrice: price.noPrice,
        })
      }
    } else if (price && !previousPrice) {
      // First load
      setPreviousPrice({
        yesPrice: price.yesPrice,
        noPrice: price.noPrice,
      })
    }
  }, [price, previousPrice])

  const priceChange: PriceChange | null =
    price && previousPrice
      ? {
          marketId: price.marketId,
          yesPriceChange:
            price.yesPrice > previousPrice.yesPrice
              ? "up"
              : price.yesPrice < previousPrice.yesPrice
                ? "down"
                : "none",
          noPriceChange:
            price.noPrice > previousPrice.noPrice
              ? "up"
              : price.noPrice < previousPrice.noPrice
                ? "down"
                : "none",
        }
      : null

  return {
    price,
    priceChange,
    isLoading,
  }
}
