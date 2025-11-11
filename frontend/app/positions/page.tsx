"use client"

import { useAccount } from "wagmi"
import { PositionList } from "@/components/positions"
import { useUserPositions } from "@/lib/hooks/useUserPositions"
import { usePositionPayouts } from "@/lib/hooks/usePositionPayout"
import { formatBigInt } from "@/lib/utils/format"
import { cn } from "@/lib/utils/cn"
import { TrendingUp, TrendingDown, Wallet } from "lucide-react"

export default function PositionsPage() {
  const { address, isConnected } = useAccount()
  const { positions, isLoading: positionsLoading } = useUserPositions()
  const { stats, isLoading: statsLoading } = usePositionPayouts(positions)

  // Show authentication prompt if not logged in
  if (!isConnected) {
    return (
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col items-center justify-center">
          <div className="glass-card p-12 rounded-2xl max-w-md w-full text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-glass-medium flex items-center justify-center">
              <Wallet className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-3">
              Connect Your Wallet
            </h2>
            <p className="text-text-secondary mb-6">
              Please connect your wallet to view your trading positions and
              track your performance.
            </p>
            <p className="text-sm text-text-secondary">
              Click the "Sign In" button in the navigation bar to get started.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const isProfitable = stats.totalProfitLoss > BigInt(0)
  const isBreakEven = stats.totalProfitLoss === BigInt(0)

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          My Positions
        </h1>
        <p className="text-text-secondary">
          Track your active and resolved prediction market positions
        </p>
      </div>

      {/* Summary Statistics */}
      {positions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Total Staked */}
          <div className="glass-card p-6">
            <div className="text-sm text-text-secondary mb-2">Total Staked</div>
            {statsLoading ? (
              <div className="w-32 h-8 bg-glass-medium animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-bold font-mono text-text-primary">
                {formatBigInt(stats.totalStaked, 18, 4)} BNB
              </div>
            )}
          </div>

          {/* Current Value */}
          <div className="glass-card p-6">
            <div className="text-sm text-text-secondary mb-2">
              Current Value
            </div>
            {statsLoading ? (
              <div className="w-32 h-8 bg-glass-medium animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-bold font-mono text-text-primary">
                {formatBigInt(stats.totalPayout, 18, 4)} BNB
              </div>
            )}
          </div>

          {/* Total P&L */}
          <div className="glass-card p-6">
            <div className="text-sm text-text-secondary mb-2">Total P&L</div>
            {statsLoading ? (
              <div className="w-32 h-8 bg-glass-medium animate-pulse rounded" />
            ) : (
              <div className="flex items-center gap-2">
                {isProfitable && (
                  <TrendingUp className="w-5 h-5 text-success" />
                )}
                {!isProfitable && !isBreakEven && (
                  <TrendingDown className="w-5 h-5 text-error" />
                )}
                <div>
                  <div
                    className={cn(
                      "text-2xl font-bold font-mono",
                      isProfitable && "text-success",
                      !isProfitable && !isBreakEven && "text-error",
                      isBreakEven && "text-text-primary"
                    )}
                  >
                    {isProfitable && "+"}
                    {formatBigInt(stats.totalProfitLoss, 18, 4)} BNB
                  </div>
                  <div
                    className={cn(
                      "text-sm font-medium",
                      isProfitable && "text-success",
                      !isProfitable && !isBreakEven && "text-error",
                      isBreakEven && "text-text-secondary"
                    )}
                  >
                    {isProfitable && "+"}
                    {stats.totalProfitLossPercentage.toFixed(2)}%
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Position List */}
      <PositionList />
    </div>
  )
}
