// Hook for calculating position payouts and P&L

import { useEffect, useState } from "react"
import { useReadContracts } from "wagmi"
import {
  PREDICTION_MARKET_ABI,
  LIQUIDITY_MARKET_ABI,
  getContractAddresses,
} from "@/lib/contracts"
import { useMarketPrice } from "./useMarketPrices"
import type { Position, PositionWithPayout } from "@/types"

const POLLING_INTERVAL = 10000 // 10 seconds

/**
 * Hook to calculate payout for a single position
 */
export function usePositionPayout(position: Position | null) {
  const chainId = 97 // BNB Testnet
  const addresses = getContractAddresses(chainId)
  const { price } = useMarketPrice(position?.market || null)

  const [positionWithPayout, setPositionWithPayout] =
    useState<PositionWithPayout | null>(null)

  const isPriceMarket = position?.market.type === "PRICE"
  const contractAddress = isPriceMarket
    ? addresses.predictionMarket
    : addresses.liquidityMarket
  const abi = isPriceMarket ? PREDICTION_MARKET_ABI : LIQUIDITY_MARKET_ABI
  const marketId = position ? BigInt(position.marketId) : BigInt(0)

  // Fetch trader payout (for resolved markets)
  const { data: payoutData } = useReadContracts({
    contracts: position
      ? [
          {
            address: contractAddress,
            abi,
            functionName: "getTraderPayout" as const,
            args: [marketId, position.userAddress as `0x${string}`],
          },
        ]
      : [],
    query: {
      enabled: !!position && position.market.resolved,
      refetchInterval: POLLING_INTERVAL,
    },
  })

  // Calculate payout and P&L
  useEffect(() => {
    if (!position) {
      setPositionWithPayout(null)
      return
    }

    let potentialPayout = BigInt(0)
    let actualPayout: bigint | undefined

    if (position.market.resolved) {
      // For resolved markets, use actual payout from contract
      if (payoutData?.[0]?.status === "success") {
        actualPayout = payoutData[0].result as bigint
        potentialPayout = actualPayout
      }
    } else if (price) {
      // For active markets, calculate potential payout based on current prices
      // Potential payout = (yesShares * yesPrice) + (noShares * noPrice)
      const yesPayout = (position.yesShares * price.yesPrice) / BigInt(1e18)
      const noPayout = (position.noShares * price.noPrice) / BigInt(1e18)
      potentialPayout = yesPayout + noPayout
    }

    // Calculate P&L
    const profitLoss = potentialPayout - position.totalStaked
    const profitLossPercentage =
      position.totalStaked > BigInt(0)
        ? Number((profitLoss * BigInt(10000)) / position.totalStaked) / 100
        : 0

    const positionWithPayoutData: PositionWithPayout = {
      ...position,
      potentialPayout,
      actualPayout,
      profitLoss,
      profitLossPercentage,
    }

    setPositionWithPayout(positionWithPayoutData)
  }, [position, price, payoutData])

  return {
    position: positionWithPayout,
    isLoading: !positionWithPayout && !!position,
  }
}

/**
 * Hook to calculate payouts for multiple positions
 */
export function usePositionPayouts(positions: Position[]) {
  const chainId = 97 // BNB Testnet
  const addresses = getContractAddresses(chainId)

  const [positionsWithPayouts, setPositionsWithPayouts] = useState<
    PositionWithPayout[]
  >([])

  // Prepare contract calls for resolved markets
  const resolvedPositions = positions.filter((p) => p.market.resolved)
  const contracts = resolvedPositions.flatMap((position) => {
    const isPriceMarket = position.market.type === "PRICE"
    const contractAddress = isPriceMarket
      ? addresses.predictionMarket
      : addresses.liquidityMarket
    const abi = isPriceMarket ? PREDICTION_MARKET_ABI : LIQUIDITY_MARKET_ABI
    const marketId = BigInt(position.marketId)

    return [
      {
        address: contractAddress,
        abi,
        functionName: "getTraderPayout" as const,
        args: [marketId, position.userAddress as `0x${string}`],
      },
    ]
  })

  const { data: payoutData, isLoading } = useReadContracts({
    contracts,
    query: {
      enabled: resolvedPositions.length > 0,
      refetchInterval: POLLING_INTERVAL,
    },
  })

  // Fetch current prices for active markets
  const activePriceContracts = positions
    .filter((p) => !p.market.resolved)
    .flatMap((position) => {
      const isPriceMarket = position.market.type === "PRICE"
      const contractAddress = isPriceMarket
        ? addresses.predictionMarket
        : addresses.liquidityMarket
      const abi = isPriceMarket ? PREDICTION_MARKET_ABI : LIQUIDITY_MARKET_ABI
      const marketId = BigInt(position.marketId)

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

  const { data: priceData } = useReadContracts({
    contracts: activePriceContracts,
    query: {
      enabled: positions.some((p) => !p.market.resolved),
      refetchInterval: POLLING_INTERVAL,
    },
  })

  // Calculate payouts for all positions
  useEffect(() => {
    const results: PositionWithPayout[] = []

    positions.forEach((position, index) => {
      let potentialPayout = BigInt(0)
      let actualPayout: bigint | undefined

      if (position.market.resolved) {
        // Find payout data for this resolved position
        const resolvedIndex = resolvedPositions.findIndex(
          (p) => p.marketId === position.marketId
        )
        if (
          resolvedIndex >= 0 &&
          payoutData?.[resolvedIndex]?.status === "success"
        ) {
          actualPayout = payoutData[resolvedIndex].result as bigint
          potentialPayout = actualPayout
        }
      } else {
        // Calculate potential payout for active position
        const activePositions = positions.filter((p) => !p.market.resolved)
        const activeIndex = activePositions.findIndex(
          (p) => p.marketId === position.marketId
        )

        if (activeIndex >= 0 && priceData) {
          const yesPriceResult = priceData[activeIndex * 2]
          const noPriceResult = priceData[activeIndex * 2 + 1]

          if (
            yesPriceResult?.status === "success" &&
            noPriceResult?.status === "success"
          ) {
            const yesPrice = yesPriceResult.result as bigint
            const noPrice = noPriceResult.result as bigint

            const yesPayout = (position.yesShares * yesPrice) / BigInt(1e18)
            const noPayout = (position.noShares * noPrice) / BigInt(1e18)
            potentialPayout = yesPayout + noPayout
          }
        }
      }

      // Calculate P&L
      const profitLoss = potentialPayout - position.totalStaked
      const profitLossPercentage =
        position.totalStaked > BigInt(0)
          ? Number((profitLoss * BigInt(10000)) / position.totalStaked) / 100
          : 0

      results.push({
        ...position,
        potentialPayout,
        actualPayout,
        profitLoss,
        profitLossPercentage,
      })
    })

    setPositionsWithPayouts(results)
  }, [positions, payoutData, priceData, resolvedPositions])

  // Calculate total stats
  const totalStaked = positionsWithPayouts.reduce(
    (sum, p) => sum + p.totalStaked,
    BigInt(0)
  )
  const totalPayout = positionsWithPayouts.reduce(
    (sum, p) => sum + p.potentialPayout,
    BigInt(0)
  )
  const totalProfitLoss = totalPayout - totalStaked
  const totalProfitLossPercentage =
    totalStaked > BigInt(0)
      ? Number((totalProfitLoss * BigInt(10000)) / totalStaked) / 100
      : 0

  return {
    positions: positionsWithPayouts,
    isLoading,
    stats: {
      totalStaked,
      totalPayout,
      totalProfitLoss,
      totalProfitLossPercentage,
    },
  }
}
