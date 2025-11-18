"use client"

import { useState } from "react"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { PositionCard } from "./PositionCard"
import { useFilteredPositions } from "@/lib/hooks/useUserPositions"
import { TrendingUp, Package } from "lucide-react"

interface PositionListProps {
  className?: string
}

export function PositionList({ className }: PositionListProps) {
  const [filter, setFilter] = useState<"active" | "resolved">("active")

  const { positions, count, isLoading } = useFilteredPositions(filter)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="lg" label="Loading positions..." />
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter("active")}
          className={`
            px-6 py-2.5 rounded-lg font-semibold text-sm whitespace-nowrap transition-all
            ${
              filter === "active"
                ? "bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg"
                : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
            }
          `}
        >
          Active
        </button>
        <button
          onClick={() => setFilter("resolved")}
          className={`
            px-6 py-2.5 rounded-lg font-semibold text-sm whitespace-nowrap transition-all
            ${
              filter === "resolved"
                ? "bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg"
                : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
            }
          `}
        >
          Resolved
        </button>
      </div>

      {/* Positions Grid */}
      {count === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {positions.map((position) => (
            <PositionCard key={position.marketId} position={position} />
          ))}
        </div>
      )}
    </div>
  )
}

interface EmptyStateProps {
  filter: "active" | "resolved"
}

function EmptyState({ filter }: EmptyStateProps) {
  const isActive = filter === "active"

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="bg-white/5 border border-white/10 backdrop-blur-xl p-12 rounded-3xl max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
          {isActive ? (
            <TrendingUp className="w-8 h-8 text-primary" />
          ) : (
            <Package className="w-8 h-8 text-white/60" />
          )}
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          {isActive ? "No Active Positions" : "No Resolved Positions"}
        </h3>
        <p className="text-white/60 mb-6">
          {isActive
            ? "You don't have any active positions yet. Start trading on prediction markets to see your positions here."
            : "You don't have any resolved positions. Your completed markets will appear here once they're settled."}
        </p>
        {isActive && (
          <a
            href="/markets/price"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-gradient-to-br from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-medium transition-all shadow-lg"
          >
            Browse Markets
          </a>
        )}
      </div>
    </div>
  )
}
