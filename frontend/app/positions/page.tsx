"use client"

import { useAuthStore } from "@/stores/authStore"
import { PositionList } from "@/components/positions"
import { ConnectButton } from "@/components/web3/ConnectButton"
import { Wallet } from "lucide-react"

export default function PositionsPage() {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background-primary">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="bg-white/5 border border-white/10 backdrop-blur-xl p-8 rounded-3xl max-w-md w-full text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                <Wallet className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Connect Your Wallet
              </h2>
              <p className="text-white/60 mb-6">
                Please connect your wallet to view your positions
              </p>
              <div className="flex justify-center">
                <ConnectButton />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-primary">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            My Positions
          </h1>
          <p className="text-lg text-white/60">
            Track your active and resolved market positions
          </p>
        </div>

        {/* Positions List */}
        <PositionList />
      </div>
    </div>
  )
}
