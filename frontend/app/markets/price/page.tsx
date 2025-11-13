"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Plus, Search } from "lucide-react"
import { useMarkets } from "@/lib/hooks/useMarkets"
import { useAuthStore } from "@/stores/authStore"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { TradingViewChart } from "@/components/charts/TradingViewChart"
import { MarketCard } from "@/components/markets/MarketCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ASSETS, type Asset } from "@/lib/constants"
import {
  getPythFeedsByCategory,
  type PythFeed,
} from "@/lib/constants/pythFeeds"

export default function PriceMarketsPage() {
  const [selectedAsset, setSelectedAsset] = useState<Asset | "ALL">("ALL")
  const [assetSearch, setAssetSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<
    PythFeed["category"] | "all"
  >("all")
  const { allMarkets, isLoading } = useMarkets()
  const { isAuthenticated } = useAuthStore()

  // Filter for price markets only
  const priceMarkets = allMarkets.filter(
    (m): m is Extract<typeof m, { type: "PRICE" }> =>
      m.type === "PRICE" && !m.resolved
  )

  // Popular assets to show by default
  const POPULAR_ASSETS = [
    "BTC/USD",
    "ETH/USD",
    "SOL/USD",
    "BNB/USD",
    "XRP/USD",
    "ADA/USD",
    "DOGE/USD",
    "MATIC/USD",
    "DOT/USD",
    "AVAX/USD",
    "LINK/USD",
    "UNI/USD",
    "ATOM/USD",
    "LTC/USD",
    "NEAR/USD",
    "AAPL/USD",
    "TSLA/USD",
    "GOOGL/USD",
    "MSFT/USD",
    "AMZN/USD",
    "EUR/USD",
    "GBP/USD",
    "JPY/USD",
    "Gold/USD",
    "Silver/USD",
  ]

  // Filter and sort assets with smart search
  const filteredAssets = useMemo(() => {
    let assets = ASSETS

    // Filter by category
    if (selectedCategory !== "all") {
      const categoryAssets = getPythFeedsByCategory(selectedCategory)
      assets = categoryAssets.map((feed) => feed.symbol)
    }

    // Filter by search with smart ranking
    if (assetSearch) {
      const searchLower = assetSearch.toLowerCase()
      const filtered = assets.filter((a) =>
        a.toLowerCase().includes(searchLower)
      )

      // Sort by relevance
      filtered.sort((a, b) => {
        const aLower = a.toLowerCase()
        const bLower = b.toLowerCase()

        if (aLower === searchLower) return -1
        if (bLower === searchLower) return 1

        const aStarts = aLower.startsWith(searchLower)
        const bStarts = bLower.startsWith(searchLower)
        if (aStarts && !bStarts) return -1
        if (!aStarts && bStarts) return 1

        const aIndex = aLower.indexOf(searchLower)
        const bIndex = bLower.indexOf(searchLower)
        if (aIndex !== bIndex) return aIndex - bIndex

        return a.localeCompare(b)
      })

      return filtered
    }

    // Show popular assets when on "all" category with no search
    if (selectedCategory === "all") {
      return POPULAR_ASSETS.filter((asset) => ASSETS.includes(asset))
    }

    // Show first 50 assets for specific categories
    return assets.slice(0, 50)
  }, [assetSearch, selectedCategory])

  // Filter by selected asset
  const filteredMarkets =
    selectedAsset === "ALL"
      ? priceMarkets
      : priceMarkets.filter((m) => m.asset === selectedAsset)

  // Sort by deadline (soonest first)
  const sortedMarkets = [...filteredMarkets].sort(
    (a, b) => a.deadline - b.deadline
  )

  return (
    <div className="min-h-screen bg-background-primary">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Price Prediction Markets
              </h1>
              {isAuthenticated && (
                <Link href="/markets/create" className="hidden md:block">
                  <Button className="bg-gradient-to-br from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Market
                  </Button>
                </Link>
              )}
            </div>
            <p className="text-lg text-white/60 max-w-2xl mb-4">
              Predict future prices across 2000+ assets using real-time Pyth
              oracle data
            </p>
            {isAuthenticated && (
              <Link href="/markets/create" className="md:hidden">
                <Button className="w-full bg-gradient-to-br from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Market
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Asset Filter Section */}
        <div className="mb-8 space-y-4">
          {/* Search and Category Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <Input
                type="text"
                placeholder="Search assets (e.g., BTC, ETH, AAPL)..."
                value={assetSearch}
                onChange={(e) => setAssetSearch(e.target.value)}
                className="h-12 pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              {(
                ["all", "crypto", "stocks", "forex", "commodities"] as const
              ).map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat)
                    setSelectedAsset("ALL")
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? "bg-primary text-white"
                      : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Asset Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {/* ALL button */}
            <button
              onClick={() => setSelectedAsset("ALL")}
              className={`
                px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all
                ${
                  selectedAsset === "ALL"
                    ? "bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg"
                    : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                }
              `}
            >
              ALL ({priceMarkets.length})
            </button>

            {/* Asset buttons */}
            {filteredAssets.map((asset) => {
              const count = priceMarkets.filter((m) => m.asset === asset).length
              return (
                <button
                  key={asset}
                  onClick={() => setSelectedAsset(asset)}
                  className={`
                    px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all
                    ${
                      selectedAsset === asset
                        ? "bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg"
                        : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                    }
                  `}
                >
                  {asset} {count > 0 && `(${count})`}
                </button>
              )
            })}
          </div>

          {/* Search results info */}
          {assetSearch && (
            <p className="text-sm text-white/60">
              Found {filteredAssets.length} asset
              {filteredAssets.length !== 1 ? "s" : ""} matching "{assetSearch}"
            </p>
          )}
        </div>

        {/* TradingView Chart (only show when specific asset selected) */}
        {selectedAsset !== "ALL" && (
          <div className="mb-8 space-y-4">
            {/* Chart - will be hidden if not available */}
            <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden">
              <TradingViewChart
                symbol={selectedAsset.replace("/", "_")}
                asset={selectedAsset as any}
                height={500}
              />
            </div>
            {/* Analysis Button - always show */}
            <div className="flex justify-end">
              <a
                href="https://chartor.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white text-sm font-medium rounded-lg transition-all duration-300 animate-glow hover:scale-105"
              >
                Need analysis of the market?
              </a>
            </div>
          </div>
        )}

        {/* Markets Grid */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : sortedMarkets.length === 0 ? (
          <div className="bg-white/5 border border-white/10 backdrop-blur-xl p-12 rounded-3xl text-center">
            <p className="text-white/60 text-lg mb-2">
              No active markets for{" "}
              {selectedAsset === "ALL" ? "any asset" : selectedAsset}
            </p>
            <p className="text-white/40 text-sm">
              Check back soon or create your own market
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {selectedAsset === "ALL"
                  ? "All Markets"
                  : `${selectedAsset} Markets`}
              </h2>
              <p className="text-white/60">
                {sortedMarkets.length}{" "}
                {sortedMarkets.length === 1 ? "market" : "markets"}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedMarkets.map((market) => (
                <MarketCard
                  key={market.id}
                  market={market}
                  showTradingButtons={true}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
