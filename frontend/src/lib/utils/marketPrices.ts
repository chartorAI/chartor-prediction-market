import type { Market } from "@/types"

/**
 * Calculate YES and NO prices from market data using LMSR formula
 * Price = e^(q/b) / (e^(q_yes/b) + e^(q_no/b))
 *
 * For display purposes, we use a simplified calculation based on share quantities
 * The actual prices are calculated by the smart contract using the full LMSR formula
 */
export function calculateMarketPrices(market: Market) {
  // Shares use 1e16 denomination (1 share = 0.01 BNB payout)
  const qYes = Number(market.qYes) / 1e16
  const qNo = Number(market.qNo) / 1e16
  const b = Number(market.liquidityParam) / 1e18

  // If no shares have been purchased yet, return 50/50
  if (qYes === 0 && qNo === 0) {
    return {
      yesPrice: 0.5,
      noPrice: 0.5,
      yesPricePercent: 50,
      noPricePercent: 50,
    }
  }

  // Simplified LMSR price calculation
  // Price_yes = e^(q_yes/b) / (e^(q_yes/b) + e^(q_no/b))
  const expYes = Math.exp(qYes / b)
  const expNo = Math.exp(qNo / b)
  const sum = expYes + expNo

  const yesPrice = expYes / sum
  const noPrice = expNo / sum

  return {
    yesPrice,
    noPrice,
    yesPricePercent: yesPrice * 100,
    noPricePercent: noPrice * 100,
  }
}
