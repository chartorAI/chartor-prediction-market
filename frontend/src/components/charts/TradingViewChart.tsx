"use client"

import { useEffect, useRef, memo, useState } from "react"
import { findSymbol } from "@/lib/utils/findSymbol"
import type { Asset } from "@/types"

export type Timeframe = "1H" | "4H" | "1D" | "1W"

interface TradingViewChartProps {
  symbol: string
  asset?: Asset
  theme?: "dark" | "light"
  height?: number
  className?: string
}

// Declare TradingView widget on window
declare global {
  interface Window {
    TradingView: any
  }
}

export const TradingViewChart = memo(function TradingViewChart({
  symbol,
  asset,
  theme = "dark",
  height = 500,
  className = "",
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetRef = useRef<any>(null)
  const [isSearching, setIsSearching] = useState(true)
  const [resolvedSymbol, setResolvedSymbol] = useState<string | null>(null)
  const [symbolNotFound, setSymbolNotFound] = useState(false)

  // First effect: Search for symbol
  useEffect(() => {
    const searchSymbol = async () => {
      setIsSearching(true)
      setSymbolNotFound(false)

      try {
        const result = await findSymbol(symbol)
        if (result && result.symbol) {
          console.log(`[TradingView] Found chart symbol: ${result.symbol}`)
          setResolvedSymbol(result.symbol)
        } else {
          console.log(`[TradingView] Symbol not found: ${symbol}`)
          setSymbolNotFound(true)
          setResolvedSymbol(null)
        }
      } catch (error) {
        console.error("[TradingView] Error searching for symbol:", error)
        setSymbolNotFound(true)
        setResolvedSymbol(null)
      }

      setIsSearching(false)
    }

    searchSymbol()
  }, [symbol])

  // Second effect: Initialize widget once symbol is resolved
  useEffect(() => {
    if (!resolvedSymbol || isSearching) return

    const initWidget = () => {
      if (containerRef.current && window.TradingView) {
        // Remove existing widget if any
        if (widgetRef.current) {
          containerRef.current.innerHTML = ""
        }

        // Create new widget
        widgetRef.current = new window.TradingView.widget({
          container_id: containerRef.current.id,
          autosize: true,
          symbol: resolvedSymbol,
          interval: "D",
          timezone: "Etc/UTC",
          theme: theme === "dark" ? "dark" : "light",
          style: "1", // Candlestick
          locale: "en",
          toolbar_bg: theme === "dark" ? "#000000" : "#f1f3f6",
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: true,
          backgroundColor: theme === "dark" ? "#000000" : "#ffffff",
          gridColor:
            theme === "dark"
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
          allow_symbol_change: false,
          studies: [],
          disabled_features: [
            "use_localstorage_for_settings",
            "header_symbol_search",
            "symbol_search_hot_key",
          ],
          enabled_features: ["hide_left_toolbar_by_default"],
          overrides: {
            "mainSeriesProperties.candleStyle.upColor": "#10b981",
            "mainSeriesProperties.candleStyle.downColor": "#ef4444",
            "mainSeriesProperties.candleStyle.borderUpColor": "#10b981",
            "mainSeriesProperties.candleStyle.borderDownColor": "#ef4444",
            "mainSeriesProperties.candleStyle.wickUpColor": "#10b981",
            "mainSeriesProperties.candleStyle.wickDownColor": "#ef4444",
            "paneProperties.background":
              theme === "dark" ? "#000000" : "#ffffff",
            "paneProperties.backgroundType": "solid",
            "paneProperties.vertGridProperties.color":
              theme === "dark"
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.1)",
            "paneProperties.horzGridProperties.color":
              theme === "dark"
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.1)",
            "scalesProperties.textColor":
              theme === "dark" ? "#D1D5DB" : "#1F2937",
          },
        })
      }
    }

    // Check if TradingView is already loaded
    if (window.TradingView) {
      initWidget()
    } else {
      // Wait for script to load
      const checkTradingView = setInterval(() => {
        if (window.TradingView) {
          clearInterval(checkTradingView)
          initWidget()
        }
      }, 100)

      return () => {
        clearInterval(checkTradingView)
        if (widgetRef.current && containerRef.current) {
          containerRef.current.innerHTML = ""
          widgetRef.current = null
        }
      }
    }

    return () => {
      if (widgetRef.current && containerRef.current) {
        containerRef.current.innerHTML = ""
        widgetRef.current = null
      }
    }
  }, [resolvedSymbol, theme, isSearching])

  // Don't render anything if symbol not found
  if (symbolNotFound && !isSearching) {
    return null
  }

  return (
    <div className={`relative ${className}`}>
      <div
        id={`tradingview_${symbol.replace(/[^a-zA-Z0-9]/g, "_")}`}
        ref={containerRef}
        className="rounded-3xl overflow-hidden"
        style={{ height: `${height}px` }}
      />
      {isSearching && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-3xl"
          style={{ zIndex: 10 }}
        >
          <p className="text-white text-sm">Loading chart...</p>
        </div>
      )}
    </div>
  )
})
