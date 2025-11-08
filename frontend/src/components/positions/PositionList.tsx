"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
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
      <Tabs
        value={filter}
        onValueChange={(value) => setFilter(value as "active" | "resolved")}
        className="mb-6"
      >
        <TabsList>
          <TabsTrigger value="active">Active ({count})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Positions Grid */}
      {count === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {positions.map((position, index) => (
            <motion.div
              key={position.marketId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <PositionCard position={position} />
            </motion.div>
          ))}
        </motion.div>
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
      <div className="glass-card p-8 rounded-2xl max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-glass-medium flex items-center justify-center">
          {isActive ? (
            <TrendingUp className="w-8 h-8 text-primary" />
          ) : (
            <Package className="w-8 h-8 text-text-secondary" />
          )}
        </div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          {isActive ? "No Active Positions" : "No Resolved Positions"}
        </h3>
        <p className="text-text-secondary mb-6">
          {isActive
            ? "You don't have any active positions yet. Start trading on prediction markets to see your positions here."
            : "You don't have any resolved positions. Your completed markets will appear here once they're settled."}
        </p>
        {isActive && (
          <a
            href="/markets/price"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium transition-colors"
          >
            Browse Markets
          </a>
        )}
      </div>
    </div>
  )
}
