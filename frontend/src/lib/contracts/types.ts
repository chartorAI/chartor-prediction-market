// Type-safe contract interfaces

import type { Address } from "viem"
import { PYTH_FEEDS, getPythFeedId } from "@/lib/constants/pythFeeds"

// Market configuration from PredictionMarket contract
export interface PredictionMarketConfig {
  pythFeedId: `0x${string}`
  targetPrice: bigint
  deadline: bigint
  liquidityParam: bigint
  description: string
  creator: Address
  exists: boolean
}

// Market configuration from LiquidityMarket contract
export interface LiquidityMarketConfig {
  targetLiquidity: bigint
  deadline: bigint
  liquidityParam: bigint
  description: string
  creator: Address
  exists: boolean
}

// Position data structure (same for both contracts)
export interface Position {
  yesShares: bigint
  noShares: bigint
  totalStaked: bigint
}

// Whale information structure
export interface WhaleInfo {
  whale: Address
  amount: bigint
  timestamp: bigint
}

// Whale data for a market
export interface MarketWhales {
  largestYes: WhaleInfo
  largestNo: WhaleInfo
}

// Resolution status
export interface ResolutionStatus {
  isResolved: boolean
  outcome: boolean // true = YES wins, false = NO wins
}

// Current price data (for PredictionMarket)
export interface CurrentPrice {
  price: bigint
  timestamp: bigint
}

// Asset types - imported from pythFeeds for single source of truth
export type Asset = keyof typeof PYTH_FEEDS

// Re-export feed ID helpers from pythFeeds
export { getPythFeedId as getFeedIdFromAsset }

// Helper function to get asset from feed ID
export function getAssetFromFeedId(feedId: `0x${string}`): Asset | null {
  for (const [asset, feed] of Object.entries(PYTH_FEEDS)) {
    if (feed.id.toLowerCase() === feedId.toLowerCase()) {
      return asset as Asset
    }
  }
  return null
}
