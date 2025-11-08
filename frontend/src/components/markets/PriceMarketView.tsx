"use client"

import { useMarketStore } from "@/stores/marketStore"
import { TRADINGVIEW_SYMBOLS } from "@/lib/constants"
import { TradingViewChart } from "../charts/TradingViewChart"
import { AssetTabs } from "./AssetTabs"

interface PriceMarketViewProps {
  className?: string
}

export function PriceMarketView({ className = "" }: PriceMarketViewProps) {
  const { selectedAsset } = useMarketStore()

  // Get the TradingView symbol for the selected asset
  const symbol = TRADINGVIEW_SYMBOLS[selectedAsset]

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Asset selection tabs */}
      <AssetTabs />

      {/* TradingView chart */}
      <TradingViewChart symbol={symbol} asset={selectedAsset} height={500} />

      {/* Market cards will be added here in future tasks */}
      <div className="text-white/60 text-center py-8">
        Markets for {selectedAsset} will be displayed here
      </div>
    </div>
  )
}
