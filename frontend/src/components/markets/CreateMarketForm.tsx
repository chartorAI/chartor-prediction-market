"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { ASSETS, type Asset } from "@/lib/constants"
import { getPythFeedId } from "@/lib/constants/pythFeeds"
import {
  TrendingUp,
  Droplets,
  Calendar,
  Info,
  Sparkles,
  ChevronDown,
  Search,
  Check,
} from "lucide-react"

// Validation schemas
const priceMarketSchema = z.object({
  marketType: z.literal("PRICE"),
  asset: z.enum(ASSETS),
  feedId: z.string().min(1, "Feed ID is required"),
  targetPrice: z
    .string()
    .min(1, "Target price is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Target price must be a positive number",
    }),
  deadline: z
    .string()
    .min(1, "Deadline is required")
    .refine(
      (val) => {
        const date = new Date(val)
        return date > new Date()
      },
      {
        message: "Deadline must be in the future",
      }
    ),
  liquidityParam: z
    .string()
    .min(1, "Liquidity parameter is required")
    .refine(
      (val) =>
        !isNaN(Number(val)) && Number(val) >= 0.001 && Number(val) <= 1000,
      {
        message: "Liquidity parameter must be between 0.001 and 1000",
      }
    ),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(200, "Description must be at most 200 characters"),
})

const liquidityMarketSchema = z.object({
  marketType: z.literal("LIQUIDITY"),
  targetLiquidity: z
    .string()
    .min(1, "Target liquidity is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Target liquidity must be a positive number",
    }),
  deadline: z
    .string()
    .min(1, "Deadline is required")
    .refine(
      (val) => {
        const date = new Date(val)
        return date > new Date()
      },
      {
        message: "Deadline must be in the future",
      }
    ),
  liquidityParam: z
    .string()
    .min(1, "Liquidity parameter is required")
    .refine(
      (val) =>
        !isNaN(Number(val)) && Number(val) >= 0.001 && Number(val) <= 1000,
      {
        message: "Liquidity parameter must be between 0.001 and 1000",
      }
    ),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(200, "Description must be at most 200 characters"),
})

interface CreateMarketFormProps {
  onSubmit: (data: MarketFormData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export type MarketFormData =
  | z.infer<typeof priceMarketSchema>
  | z.infer<typeof liquidityMarketSchema>

export function CreateMarketForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
}: CreateMarketFormProps) {
  const [marketType, setMarketType] = useState<"PRICE" | "LIQUIDITY">("PRICE")
  const [asset, setAsset] = useState<Asset>("BTC")
  const [targetPrice, setTargetPrice] = useState("")
  const [targetLiquidity, setTargetLiquidity] = useState("")
  const [deadline, setDeadline] = useState("")
  const [liquidityParam, setLiquidityParam] = useState("10")
  const [description, setDescription] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false)
  const [assetSearch, setAssetSearch] = useState("")

  const minDeadline = useMemo(() => {
    const date = new Date()
    date.setHours(date.getHours() + 1)
    return date.toISOString().slice(0, 16)
  }, [])

  const filteredAssets = useMemo(() => {
    if (!assetSearch) return ASSETS
    return ASSETS.filter((a) =>
      a.toLowerCase().includes(assetSearch.toLowerCase())
    )
  }, [assetSearch])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest(".asset-dropdown")) {
        setIsAssetDropdownOpen(false)
        setAssetSearch("")
      }
    }

    if (isAssetDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isAssetDropdownOpen])

  const validateForm = (): boolean => {
    const formData =
      marketType === "PRICE"
        ? {
            marketType,
            asset,
            feedId: getPythFeedId(asset),
            targetPrice,
            deadline,
            liquidityParam,
            description,
          }
        : { marketType, targetLiquidity, deadline, liquidityParam, description }

    const schema =
      marketType === "PRICE" ? priceMarketSchema : liquidityMarketSchema
    const result = schema.safeParse(formData)

    if (!result.success) {
      const newErrors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as string
        newErrors[path] = issue.message
      })
      setErrors(newErrors)
      return false
    }

    setErrors({})
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    const formData: MarketFormData =
      marketType === "PRICE"
        ? {
            marketType: "PRICE" as const,
            asset,
            feedId: getPythFeedId(asset),
            targetPrice,
            deadline,
            liquidityParam,
            description,
          }
        : {
            marketType: "LIQUIDITY" as const,
            targetLiquidity,
            deadline,
            liquidityParam,
            description,
          }

    await onSubmit(formData)
  }

  const deadlineDate = deadline ? new Date(deadline) : null
  const daysUntilDeadline = deadlineDate
    ? Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className="space-y-6">
      {/* Form Content */}
      <div className="bg-slate-900/30 border border-white/10 rounded-xl p-6 md:p-8">
        <div className="space-y-8">
          {/* Market Type */}
          <div className="space-y-4">
            <div>
              <label className="text-base font-bold text-white">
                Market Type
              </label>
              <p className="text-sm text-white/60 mt-1">
                Choose between price prediction or liquidity forecasting
              </p>
            </div>
            <Tabs
              value={marketType}
              onValueChange={(value) =>
                setMarketType(value as "PRICE" | "LIQUIDITY")
              }
            >
              <TabsList className="grid w-full grid-cols-2 bg-slate-900/50 p-1.5 h-auto gap-2 border border-white/5">
                <TabsTrigger
                  value="PRICE"
                  className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-purple-600 data-[state=active]:shadow-lg h-auto py-3 rounded-lg transition-all"
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-semibold">Price Market</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="LIQUIDITY"
                  className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-purple-600 data-[state=active]:shadow-lg h-auto py-3 rounded-lg transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4" />
                    <span className="font-semibold">Liquidity Market</span>
                  </div>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <AnimatePresence mode="wait">
            {marketType === "PRICE" ? (
              <motion.div
                key="price"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {/* Asset */}
                <div className="space-y-3">
                  <label className="text-base font-semibold text-white">
                    Select Asset
                  </label>
                  <div className="relative asset-dropdown">
                    <button
                      type="button"
                      onClick={() =>
                        setIsAssetDropdownOpen(!isAssetDropdownOpen)
                      }
                      disabled={isSubmitting}
                      className="w-full h-12 px-4 bg-slate-900/50 border border-white/10 hover:border-white/20 rounded-lg text-white font-semibold text-left flex items-center justify-between transition-all"
                    >
                      <span>{asset}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-white/40 transition-transform ${
                          isAssetDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isAssetDropdownOpen && (
                      <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-white/10 rounded-lg shadow-xl overflow-hidden">
                        {/* Search */}
                        <div className="p-2 border-b border-white/10">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                            <Input
                              type="text"
                              placeholder="Search assets..."
                              value={assetSearch}
                              onChange={(e) => setAssetSearch(e.target.value)}
                              className="h-9 pl-9 bg-slate-800/50 border-white/10 text-white text-sm"
                              autoFocus
                            />
                          </div>
                        </div>

                        {/* Asset List */}
                        <div className="max-h-60 overflow-y-auto">
                          {filteredAssets.length > 0 ? (
                            filteredAssets.map((assetOption) => (
                              <button
                                key={assetOption}
                                type="button"
                                onClick={() => {
                                  setAsset(assetOption as Asset)
                                  setIsAssetDropdownOpen(false)
                                  setAssetSearch("")
                                }}
                                className="w-full px-4 py-2.5 text-left hover:bg-slate-800/50 transition-colors flex items-center justify-between group"
                              >
                                <span
                                  className={`font-semibold ${
                                    asset === assetOption
                                      ? "text-primary"
                                      : "text-white/80 group-hover:text-white"
                                  }`}
                                >
                                  {assetOption}
                                </span>
                                {asset === assetOption && (
                                  <Check className="w-4 h-4 text-primary" />
                                )}
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-6 text-center text-white/40 text-sm">
                              No assets found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Target Price */}
                <div className="space-y-3">
                  <label className="text-base font-semibold text-white">
                    Target Price (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-semibold text-lg">
                      $
                    </span>
                    <Input
                      type="number"
                      placeholder="50000"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      disabled={isSubmitting}
                      step="0.01"
                      min="0"
                      className="h-12 pl-8 bg-slate-900/50 border-white/10 focus:border-primary/50 text-white font-semibold rounded-lg text-lg"
                    />
                  </div>
                  {errors.targetPrice && (
                    <p className="text-red-400 text-sm flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                      {errors.targetPrice}
                    </p>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="liquidity"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {/* Target Liquidity */}
                <div className="space-y-3">
                  <label className="text-base font-semibold text-white">
                    Target Liquidity (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-semibold text-lg">
                      $
                    </span>
                    <Input
                      type="number"
                      placeholder="1000000"
                      value={targetLiquidity}
                      onChange={(e) => setTargetLiquidity(e.target.value)}
                      disabled={isSubmitting}
                      step="0.01"
                      min="0"
                      className="h-12 pl-8 bg-slate-900/50 border-white/10 focus:border-primary/50 text-white font-semibold rounded-lg text-lg"
                    />
                  </div>
                  {errors.targetLiquidity && (
                    <p className="text-red-400 text-sm flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                      {errors.targetLiquidity}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Deadline */}
          <div className="space-y-3">
            <label className="text-base font-semibold text-white">
              Market Deadline
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                <Input
                  type="date"
                  value={deadline.split("T")[0] || ""}
                  onChange={(e) => {
                    const time = deadline.split("T")[1] || "12:00"
                    setDeadline(
                      e.target.value ? `${e.target.value}T${time}` : ""
                    )
                  }}
                  disabled={isSubmitting}
                  min={minDeadline.split("T")[0]}
                  className="h-12 pl-11 bg-slate-900/50 border-white/10 focus:border-primary/50 text-white rounded-lg"
                />
              </div>
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <path strokeWidth="2" strokeLinecap="round" d="M12 6v6l4 2" />
                </svg>
                <Input
                  type="time"
                  value={deadline.split("T")[1] || ""}
                  onChange={(e) => {
                    const date =
                      deadline.split("T")[0] || minDeadline.split("T")[0]
                    setDeadline(`${date}T${e.target.value}`)
                  }}
                  disabled={isSubmitting}
                  className="h-12 pl-11 bg-slate-900/50 border-white/10 focus:border-primary/50 text-white rounded-lg"
                />
              </div>
            </div>
            {deadline.split("T")[0] && (
              <div className="flex items-center gap-2 flex-wrap">
                {["09:00", "12:00", "15:00", "18:00", "23:59"].map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => {
                      const date = deadline.split("T")[0]
                      setDeadline(`${date}T${time}`)
                    }}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 text-sm font-medium text-white/50 hover:text-white bg-slate-800/30 hover:bg-slate-800/60 border border-white/10 rounded-lg transition-all"
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}
            {errors.deadline && (
              <p className="text-red-400 text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                {errors.deadline}
              </p>
            )}
          </div>

          {/* Liquidity Parameter */}
          <div className="space-y-3">
            <label className="text-base font-semibold text-white">
              Liquidity Parameter (b)
            </label>
            <Input
              type="number"
              placeholder="10"
              value={liquidityParam}
              onChange={(e) => setLiquidityParam(e.target.value)}
              disabled={isSubmitting}
              step="0.001"
              min="0.001"
              max="1000"
              className="h-12 bg-slate-900/50 border-white/10 focus:border-primary/50 text-white font-semibold rounded-lg"
            />
            <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-white/70 leading-relaxed">
                Higher values = more liquidity.{" "}
                <span className="text-primary font-semibold">
                  Range: 0.001 - 1000
                </span>
              </p>
            </div>
            {errors.liquidityParam && (
              <p className="text-red-400 text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                {errors.liquidityParam}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-3">
            <label className="flex items-center justify-between text-base font-semibold text-white">
              <span>Market Description</span>
              <span
                className={`text-sm font-normal ${
                  description.length > 180 ? "text-amber-400" : "text-white/40"
                }`}
              >
                {description.length}/200
              </span>
            </label>
            <textarea
              placeholder="Describe the market prediction..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              maxLength={200}
              rows={4}
              className="flex w-full rounded-lg bg-slate-900/50 border border-white/10 px-4 py-3 text-sm text-white leading-relaxed transition-all placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary/50 resize-none"
            />
            {errors.description && (
              <p className="text-red-400 text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Preview */}
          {(targetPrice || targetLiquidity) && deadline && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-xl bg-slate-800/30 border border-primary/20"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <span className="text-base font-bold text-white">
                  Market Preview
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="text-white/50 text-sm">Type</div>
                  <div className="font-bold text-white text-lg">
                    {marketType === "PRICE" ? `${asset} Price` : "Liquidity"}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-white/50 text-sm">Target</div>
                  <div className="font-bold text-primary text-lg">
                    $
                    {marketType === "PRICE"
                      ? parseFloat(targetPrice).toLocaleString()
                      : parseFloat(targetLiquidity).toLocaleString()}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-white/50 text-sm">Duration</div>
                  <div className="font-bold text-white text-lg">
                    {daysUntilDeadline} days
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-white/50 text-sm">Liquidity Param</div>
                  <div className="font-bold text-white text-lg">
                    {liquidityParam}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-6">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full h-12 bg-gradient-to-br from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-bold shadow-lg rounded-lg"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <LoadingSpinner size="sm" />
              <span>Creating Market...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Launch Market</span>
            </div>
          )}
        </Button>
      </div>
    </div>
  )
}
