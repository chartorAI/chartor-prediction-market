// Type-safe contract interfaces

import type { Address } from "viem"

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

// Asset types for price markets
export type Asset = "BTC" | "ETH" | "BNB" | "GOLD" | "OIL"

// Pyth feed IDs for each asset
export const PYTH_FEED_IDS: Record<Asset, `0x${string}`> = {
  BTC: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
  ETH: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
  BNB: "0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f",
  GOLD: "0x765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2",
  OIL: "0xf9c0172ba10dfa4d19088d94f5bf61d3b54d5bd7483a322a982e1373ee8ea31b",
}

// Helper function to get asset from feed ID
export function getAssetFromFeedId(feedId: `0x${string}`): Asset | null {
  for (const [asset, id] of Object.entries(PYTH_FEED_IDS)) {
    if (id.toLowerCase() === feedId.toLowerCase()) {
      return asset as Asset
    }
  }
  return null
}

// Helper function to get feed ID from asset
export function getFeedIdFromAsset(asset: Asset): `0x${string}` {
  return PYTH_FEED_IDS[asset]
}
