"use client"

import { ASSETS } from "@/lib/constants"
import { useMarketStore } from "@/stores/marketStore"

interface AssetTabsProps {
  className?: string
}

export function AssetTabs({ className = "" }: AssetTabsProps) {
  const { selectedAsset, setSelectedAsset } = useMarketStore()

  return (
    <div className={`flex gap-2 ${className}`}>
      {ASSETS.map((asset) => (
        <button
          key={asset}
          onClick={() => setSelectedAsset(asset)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            selectedAsset === asset
              ? "bg-primary text-white shadow-lg shadow-primary/20"
              : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
          }`}
        >
          {asset}
        </button>
      ))}
    </div>
  )
}
