// App constants
export const APP_NAME = "Prediction Market"
export const APP_DESCRIPTION = "Decentralized prediction markets on BNB Chain"

// Chain configuration
export const CHAIN_ID = 97 // BNB Testnet
export const CHAIN_NAME = "BNB Smart Chain Testnet"
export const RPC_URL = "https://data-seed-prebsc-1-s1.binance.org:8545/"
export const BLOCK_EXPLORER = "https://testnet.bscscan.com"

// Assets
export const ASSETS = ["BTC", "ETH", "BNB", "GOLD", "OIL"] as const
export type Asset = (typeof ASSETS)[number]

// Market types
export const MARKET_TYPES = ["PRICE", "LIQUIDITY"] as const
export type MarketType = (typeof MARKET_TYPES)[number]

// Update intervals (in milliseconds)
export const PRICE_UPDATE_INTERVAL = 10000 // 10 seconds
export const WHALE_UPDATE_INTERVAL = 15000 // 15 seconds

// Display settings
export const MAX_WHALE_DISPLAY = 3
export const ADDRESS_TRUNCATE_LENGTH = 6

// TradingView symbols (exchange:symbol format)
export const TRADINGVIEW_SYMBOLS: Record<Asset, string> = {
  BTC: "BINANCE:BTCUSDT",
  ETH: "BINANCE:ETHUSDT",
  BNB: "BINANCE:BNBUSDT",
  GOLD: "OANDA:XAUUSD",
  OIL: "TVC:USOIL",
}
