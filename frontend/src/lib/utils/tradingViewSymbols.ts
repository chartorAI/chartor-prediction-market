/**
 * Generate TradingView symbol from Pyth asset symbol
 * Maps Pyth price feed symbols to TradingView chart symbols
 */

import { PYTH_FEEDS, type PythFeed } from "@/lib/constants/pythFeeds"

/**
 * Get TradingView symbol for a given asset
 * @param assetSymbol - The Pyth asset symbol (e.g., "BTC/USD", "AAPL/USD")
 * @returns TradingView symbol (e.g., "BINANCE:BTCUSDT", "NASDAQ:AAPL") or null if not supported
 */
export function getTradingViewSymbol(assetSymbol: string): string | null {
  const feed = PYTH_FEEDS[assetSymbol]
  if (!feed) {
    console.warn(`[TradingView] No feed found for: ${assetSymbol}`)
    return null
  }

  const base = feed.base
  const category = feed.category

  console.log(
    `[TradingView] Mapping ${assetSymbol} (base: ${base}, category: ${category})`
  )

  // Crypto assets
  if (category === "crypto") {
    const baseUpper = base.toUpperCase()

    // Special cases for crypto - check exact matches first
    const cryptoMappings: Record<string, string> = {
      BTC: "BINANCE:BTCUSDT",
      ETH: "BINANCE:ETHUSDT",
      BNB: "BINANCE:BNBUSDT",
      SOL: "BINANCE:SOLUSDT",
      USDT: "BINANCE:USDTUSD",
      USDC: "BINANCE:USDCUSDT",
      XRP: "BINANCE:XRPUSDT",
      ADA: "BINANCE:ADAUSDT",
      DOGE: "BINANCE:DOGEUSDT",
      DOT: "BINANCE:DOTUSDT",
      MATIC: "BINANCE:MATICUSDT",
      AVAX: "BINANCE:AVAXUSDT",
      LINK: "BINANCE:LINKUSDT",
      UNI: "BINANCE:UNIUSDT",
      ATOM: "BINANCE:ATOMUSDT",
      LTC: "BINANCE:LTCUSDT",
      BCH: "BINANCE:BCHUSDT",
      NEAR: "BINANCE:NEARUSDT",
      APT: "BINANCE:APTUSDT",
      ARB: "BINANCE:ARBUSDT",
      OP: "BINANCE:OPUSDT",
      SUI: "BINANCE:SUIUSDT",
      INJ: "BINANCE:INJUSDT",
      TIA: "BINANCE:TIAUSDT",
      SEI: "BINANCE:SEIUSDT",
      HYPE: "BINANCE:HYPEUSDT",
      // Wrapped/Staked tokens - map to underlying
      WETH: "BINANCE:ETHUSDT",
      WBTC: "BINANCE:BTCUSDT",
      STETH: "BINANCE:ETHUSDT",
      RETH: "BINANCE:ETHUSDT",
      CBETH: "BINANCE:ETHUSDT",
      WSTETH: "BINANCE:ETHUSDT",
      MSOL: "BINANCE:SOLUSDT",
      STSOL: "BINANCE:SOLUSDT",
      BBSOL: "BINANCE:SOLUSDT",
      JITOSOLSOL: "BINANCE:SOLUSDT",
      EZETH: "BINANCE:ETHUSDT",
      WEETH: "BINANCE:ETHUSDT",
    }

    // Check exact match first
    if (cryptoMappings[baseUpper]) {
      const symbol = cryptoMappings[baseUpper]
      console.log(`[TradingView] Exact match: ${baseUpper} → ${symbol}`)
      return symbol
    }

    // Try to clean wrapped/staked prefixes for unknown tokens
    let cleanBase = baseUpper
    if (baseUpper.startsWith("W") && baseUpper.length > 2) {
      // WETH → ETH, WBTC → BTC
      const unwrapped = baseUpper.substring(1)
      if (cryptoMappings[unwrapped]) {
        return cryptoMappings[unwrapped]
      }
    }
    if (baseUpper.startsWith("ST") && baseUpper.length > 3) {
      // STETH → ETH, STSOL → SOL
      const unstaked = baseUpper.substring(2)
      if (cryptoMappings[unstaked]) {
        return cryptoMappings[unstaked]
      }
    }

    // Default: try BINANCE:BASEUSDT
    const defaultSymbol = `BINANCE:${baseUpper}USDT`
    console.log(
      `[TradingView] Default mapping: ${baseUpper} → ${defaultSymbol}`
    )
    return defaultSymbol
  }

  // Stock/Equity assets
  if (category === "stocks") {
    // Most US stocks are on NASDAQ or NYSE
    // TradingView uses the ticker symbol directly
    const stockMappings: Record<string, string> = {
      AAPL: "NASDAQ:AAPL",
      MSFT: "NASDAQ:MSFT",
      GOOGL: "NASDAQ:GOOGL",
      GOOG: "NASDAQ:GOOG",
      AMZN: "NASDAQ:AMZN",
      TSLA: "NASDAQ:TSLA",
      META: "NASDAQ:META",
      NVDA: "NASDAQ:NVDA",
      AMD: "NASDAQ:AMD",
      NFLX: "NASDAQ:NFLX",
      DIS: "NYSE:DIS",
      BA: "NYSE:BA",
      JPM: "NYSE:JPM",
      V: "NYSE:V",
      MA: "NYSE:MA",
      WMT: "NYSE:WMT",
      JNJ: "NYSE:JNJ",
      PG: "NYSE:PG",
      XOM: "NYSE:XOM",
      CVX: "NYSE:CVX",
    }

    if (stockMappings[base]) {
      return stockMappings[base]
    }

    // Default: try NASDAQ first for US stocks
    return `NASDAQ:${base}`
  }

  // Forex pairs
  if (category === "forex") {
    // TradingView forex format: FX:XXXYYY
    const [baseCurrency, quoteCurrency] = assetSymbol.split("/")
    if (baseCurrency && quoteCurrency) {
      return `FX:${baseCurrency}${quoteCurrency}`
    }
    return null
  }

  // Commodities
  if (category === "commodities") {
    const commodityMappings: Record<string, string> = {
      UKOILSPOT: "TVC:UKOIL", // Brent Crude
      USOILSPOT: "TVC:USOIL", // WTI Crude
      GOLD: "OANDA:XAUUSD",
      SILVER: "OANDA:XAGUSD",
      COPPER: "COMEX:HG1!",
      NATURALGAS: "NYMEX:NG1!",
    }

    if (commodityMappings[base]) {
      return commodityMappings[base]
    }

    // Try generic commodity format
    return `TVC:${base}`
  }

  // For other categories, return null (no chart available)
  return null
}

/**
 * Check if TradingView chart is available for an asset
 */
export function hasTradingViewChart(assetSymbol: string): boolean {
  return getTradingViewSymbol(assetSymbol) !== null
}

/**
 * Get a fallback symbol if the primary one doesn't work
 */
export function getFallbackTradingViewSymbol(
  assetSymbol: string
): string | null {
  const feed = PYTH_FEEDS[assetSymbol]
  if (!feed) return null

  // For crypto, try different exchanges
  if (feed.category === "crypto") {
    const base = feed.base.toUpperCase()
    const alternatives = [
      `COINBASE:${base}USD`,
      `KRAKEN:${base}USD`,
      `BITSTAMP:${base}USD`,
    ]
    return alternatives[0]
  }

  return null
}
