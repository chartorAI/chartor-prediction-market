"use client"

import { useState, useMemo } from "react"
import { useMarketStore } from "@/stores/marketStore"
import {
  getPythFeedsByCategory,
  type PythFeed,
} from "@/lib/constants/pythFeeds"
import { ChevronDown } from "lucide-react"

interface AssetTabsProps {
  className?: string
}

export function AssetTabs({ className = "" }: AssetTabsProps) {
  const { selectedAsset, setSelectedAsset } = useMarketStore()
  const [selectedCategory, setSelectedCategory] = useState<
    PythFeed["category"] | "all"
  >("crypto")
  const [isOpen, setIsOpen] = useState(false)

  const assets = useMemo(() => {
    if (selectedCategory === "all") {
      return getPythFeedsByCategory("crypto").slice(0, 20) // Show first 20 crypto by default
    }
    return getPythFeedsByCategory(selectedCategory).slice(0, 20)
  }, [selectedCategory])

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Category Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(["crypto", "stocks", "forex", "commodities", "other"] as const).map(
          (cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          )
        )}
      </div>

      {/* Asset Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {assets.map((feed) => (
          <button
            key={feed.symbol}
            onClick={() => setSelectedAsset(feed.symbol)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              selectedAsset === feed.symbol
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            {feed.symbol}
          </button>
        ))}
      </div>
    </div>
  )
}
