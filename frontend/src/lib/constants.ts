// App constants
export const APP_NAME = "Prediction Market"
export const APP_DESCRIPTION = "Decentralized prediction markets on BNB Chain"

// Chain configuration
export const CHAIN_ID = 97 // BNB Testnet
export const CHAIN_NAME = "BNB Smart Chain Testnet"
export const RPC_URL = "https://data-seed-prebsc-1-s1.binance.org:8545/"
export const BLOCK_EXPLORER = "https://testnet.bscscan.com"

// Assets - Now supports all Pyth feeds
// Import from pythFeeds for the complete list
import { getAssetSymbols, PYTH_FEEDS } from "./constants/pythFeeds"

// Get all asset symbols (display symbols like "BTC/USD", "ETH/USD", etc.)
export const ASSETS = getAssetSymbols()
export type Asset = string

// Re-export for convenience
export { PYTH_FEEDS, getPythFeedId, getPythFeed } from "./constants/pythFeeds"

// Market types
export const MARKET_TYPES = ["PRICE", "LIQUIDITY"] as const
export type MarketType = (typeof MARKET_TYPES)[number]

// Update intervals (in milliseconds)
export const PRICE_UPDATE_INTERVAL = 10000 // 10 seconds
export const WHALE_UPDATE_INTERVAL = 15000 // 15 seconds

// Display settings
export const MAX_WHALE_DISPLAY = 3
export const ADDRESS_TRUNCATE_LENGTH = 6
