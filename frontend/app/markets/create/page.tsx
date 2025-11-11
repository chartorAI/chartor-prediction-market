"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { useAuthStore } from "@/stores/authStore"
import { useCreateMarket } from "@/lib/hooks/useCreateMarket"
import { CreateMarketForm } from "@/components/markets"
import { Button } from "@/components/ui/button"

export default function CreateMarketPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { createMarket, isCreating } = useCreateMarket()

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Authentication Required
          </h1>
          <p className="text-white/60 mb-6">
            Please connect your wallet to create a market
          </p>
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-primary">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Create Prediction Market
          </h1>
          <p className="text-lg text-white/60 max-w-2xl">
            Set up a new prediction market for price or liquidity forecasting
          </p>
        </div>

        {/* Create Market Form */}
        <div className="max-w-3xl mx-auto">
          <CreateMarketForm
            onCancel={() => router.back()}
            onSubmit={async (data) => {
              const result = await createMarket(data)
              if (result.success) {
                // Navigate to the appropriate market page
                if (data.marketType === "PRICE") {
                  router.push("/markets/price")
                } else {
                  router.push("/markets/liquidity")
                }
              }
            }}
            isSubmitting={isCreating}
          />
        </div>
      </div>
    </div>
  )
}
