import priceFeeds from "./price_feeds.json"

/**
 * Pyth Network Price Feed IDs
 * Dynamically loaded from price_feeds.json
 */

export interface PythFeed {
  id: string
  symbol: string
  name: string
  category: "crypto" | "forex" | "commodities" | "stocks" | "indices" | "other"
  description: string
  assetType: string
  base: string
}

interface PriceFeedEntry {
  id: string
  attributes: {
    asset_type: string
    base: string
    description: string
    display_symbol: string
    symbol: string
    [key: string]: any
  }
}

// Map asset types to categories
function mapAssetTypeToCategory(assetType: string): PythFeed["category"] {
  const type = assetType.toLowerCase()
  if (type === "crypto" || type.includes("crypto")) return "crypto"
  if (type === "fx" || type === "forex") return "forex"
  if (type === "commodities" || type === "commodity") return "commodities"
  if (type === "equity" || type === "stock") return "stocks"
  if (type === "indices" || type === "index") return "indices"
  return "other"
}

// Build PYTH_FEEDS from JSON data
// Use display_symbol as key to avoid duplicates (e.g., USD/BBD, USD/AWG are different)
export const PYTH_FEEDS: Record<string, PythFeed> = {}
;(priceFeeds as PriceFeedEntry[]).forEach((feed) => {
  const base = feed.attributes.base
  const category = mapAssetTypeToCategory(feed.attributes.asset_type)
  // Use display_symbol as the unique key (e.g., "BTC/USD", "EUR/USD")
  const key = feed.attributes.display_symbol

  // Add 0x prefix to feed ID if not present (required by smart contracts)
  const feedId = feed.id.startsWith("0x") ? feed.id : `0x${feed.id}`

  PYTH_FEEDS[key] = {
    id: feedId,
    symbol: feed.attributes.display_symbol,
    name: feed.attributes.description.split(" / ")[0] || base,
    category,
    description: feed.attributes.description,
    assetType: feed.attributes.asset_type,
    base,
  }
})

// Helper functions
export function getPythFeedId(symbol: string): string {
  const feed = PYTH_FEEDS[symbol]
  if (!feed) {
    throw new Error(`Unsupported asset: ${symbol}`)
  }
  return feed.id
}

export function getPythFeed(symbol: string): PythFeed {
  const feed = PYTH_FEEDS[symbol]
  if (!feed) {
    throw new Error(`Unsupported asset: ${symbol}`)
  }
  return feed
}

export function getAllPythFeeds(): PythFeed[] {
  return Object.values(PYTH_FEEDS)
}

export function getPythFeedsByCategory(
  category: PythFeed["category"]
): PythFeed[] {
  return Object.values(PYTH_FEEDS).filter((feed) => feed.category === category)
}

export function getAssetSymbols(): string[] {
  return Object.keys(PYTH_FEEDS)
}

export function isValidAsset(symbol: string): boolean {
  return symbol in PYTH_FEEDS
}

export function getPythFeedsByBase(base: string): PythFeed[] {
  return Object.values(PYTH_FEEDS).filter((feed) => feed.base === base)
}
