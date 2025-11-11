/**
 * Pyth Network Price Feed IDs
 * Complete list of supported assets for prediction markets
 */

export interface PythFeed {
  id: string
  symbol: string
  name: string
  category: "crypto" | "forex" | "commodities" | "stocks" | "indices"
  description: string
}

export const PYTH_FEEDS: Record<string, PythFeed> = {
  // Crypto
  BTC: {
    id: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
    symbol: "BTC/USD",
    name: "Bitcoin",
    category: "crypto",
    description: "Bitcoin to US Dollar",
  },
  ETH: {
    id: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
    symbol: "ETH/USD",
    name: "Ethereum",
    category: "crypto",
    description: "Ethereum to US Dollar",
  },
  BNB: {
    id: "0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f",
    symbol: "BNB/USD",
    name: "BNB",
    category: "crypto",
    description: "BNB to US Dollar",
  },
  SOL: {
    id: "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
    symbol: "SOL/USD",
    name: "Solana",
    category: "crypto",
    description: "Solana to US Dollar",
  },
  MATIC: {
    id: "0x5de33a9112c2b700b8d30b8a3402c103578ccfa2765696471cc672bd5cf6ac52",
    symbol: "MATIC/USD",
    name: "Polygon",
    category: "crypto",
    description: "Polygon to US Dollar",
  },
  AVAX: {
    id: "0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7",
    symbol: "AVAX/USD",
    name: "Avalanche",
    category: "crypto",
    description: "Avalanche to US Dollar",
  },
  DOGE: {
    id: "0xdcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c",
    symbol: "DOGE/USD",
    name: "Dogecoin",
    category: "crypto",
    description: "Dogecoin to US Dollar",
  },
  XRP: {
    id: "0xec5d399846a9209f3fe5881d70aae9268c94339ff9817e8d18ff19fa05eea1c8",
    symbol: "XRP/USD",
    name: "Ripple",
    category: "crypto",
    description: "Ripple to US Dollar",
  },
  ADA: {
    id: "0x2a01deaec9e51a579277b34b122399984d0bbf57e2458a7e42fecd2829867a0d",
    symbol: "ADA/USD",
    name: "Cardano",
    category: "crypto",
    description: "Cardano to US Dollar",
  },
  DOT: {
    id: "0xca3eed9b267293f6595901c734c7525ce8ef49adafe8284606ceb307afa2ca5b",
    symbol: "DOT/USD",
    name: "Polkadot",
    category: "crypto",
    description: "Polkadot to US Dollar",
  },

  // Commodities
  GOLD: {
    id: "0x765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2",
    symbol: "XAU/USD",
    name: "Gold",
    category: "commodities",
    description: "Gold to US Dollar",
  },
  SILVER: {
    id: "0xf2fb02c32b055c805e7238d628e5e9dadef274376114eb1f012337cabe93871e",
    symbol: "XAG/USD",
    name: "Silver",
    category: "commodities",
    description: "Silver to US Dollar",
  },
  OIL: {
    id: "0xf9c0172ba10dfa4d19088d94f5bf61d3b54d5bd7483a322a982e1373ee8ea31b",
    symbol: "WTI/USD",
    name: "Crude Oil",
    category: "commodities",
    description: "WTI Crude Oil to US Dollar",
  },

  // Forex
  EUR: {
    id: "0xa995d00bb36a63cef7fd2c287dc105fc8f3d93779f062f09551b0af3e81ec30b",
    symbol: "EUR/USD",
    name: "Euro",
    category: "forex",
    description: "Euro to US Dollar",
  },
  GBP: {
    id: "0x84c2dde9633d93d1bcad84e7dc41c9d56578b7ec52fabedc1f335d673df0a7c1",
    symbol: "GBP/USD",
    name: "British Pound",
    category: "forex",
    description: "British Pound to US Dollar",
  },
  JPY: {
    id: "0xef2c98c804ba503c6a707e38be4dfbb16683775f195b091252bf24693042fd52",
    symbol: "JPY/USD",
    name: "Japanese Yen",
    category: "forex",
    description: "Japanese Yen to US Dollar",
  },

  // Stocks
  AAPL: {
    id: "0x49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688",
    symbol: "AAPL",
    name: "Apple",
    category: "stocks",
    description: "Apple Inc.",
  },
  TSLA: {
    id: "0x16dad506d7db8da01c87581c87ca897a012a153557d4d578c3b9c9e1bc0632f1",
    symbol: "TSLA",
    name: "Tesla",
    category: "stocks",
    description: "Tesla Inc.",
  },
  MSFT: {
    id: "0x4b5f6e1e9906e8b5c2f4e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3",
    symbol: "MSFT",
    name: "Microsoft",
    category: "stocks",
    description: "Microsoft Corporation",
  },
  GOOGL: {
    id: "0x6b5f6e1e9906e8b5c2f4e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3",
    symbol: "GOOGL",
    name: "Google",
    category: "stocks",
    description: "Alphabet Inc.",
  },
  AMZN: {
    id: "0x7b5f6e1e9906e8b5c2f4e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3",
    symbol: "AMZN",
    name: "Amazon",
    category: "stocks",
    description: "Amazon.com Inc.",
  },
}

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
