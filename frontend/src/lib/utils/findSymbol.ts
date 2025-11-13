interface TradingViewSymbol {
  symbol: string
  description: string
  type: string
  exchange: string
  source_id: string
  provider_id: string
  currency_code?: string
  typespecs?: string[]
  prefix?: string
}

interface TradingViewSearchResponse {
  symbols_remaining: number
  symbols: TradingViewSymbol[]
}

export interface SymbolSearchResult {
  symbol: string
  source_id: string
}

export async function findSymbol(
  query: string
): Promise<SymbolSearchResult | null> {
  if (!query || query.trim().length === 0) {
    throw new Error("Query parameter cannot be empty")
  }

  // Normalize query: replace hyphens with underscores
  const normalizedQuery = query.replace(/-/g, "_")

  try {
    const url = `/api/symbol-search?text=${encodeURIComponent(normalizedQuery)}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(
        `Symbol search API request failed with status ${response.status}`
      )
    }

    const data: TradingViewSearchResponse = await response.json()

    if (!data.symbols || data.symbols.length === 0) {
      return null
    }

    const firstResult = data.symbols[0]
    // Remove HTML tags from symbol if present
    const cleanSymbol = firstResult.symbol.replace(/<\/?em>/g, "")

    return {
      symbol: cleanSymbol,
      source_id: firstResult.source_id,
    }
  } catch (error) {
    console.error("Error fetching symbol from TradingView:", error)
    throw error
  }
}
