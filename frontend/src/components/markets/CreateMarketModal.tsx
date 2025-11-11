"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { ASSETS, type Asset } from "@/lib/constants"
import {
  getPythFeedId,
  getPythFeedsByCategory,
} from "@/lib/constants/pythFeeds"
import {
  TrendingUp,
  Droplets,
  Calendar,
  DollarSign,
  Info,
  Sparkles,
} from "lucide-react"

// Validation schemas
const priceMarketSchema = z.object({
  marketType: z.literal("PRICE"),
  asset: z.enum(ASSETS),
  feedId: z.string().min(1, "Feed ID is required"), // Pyth feed ID
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
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Liquidity parameter must be a positive number",
    }),
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
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Liquidity parameter must be a positive number",
    }),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(200, "Description must be at most 200 characters"),
})

interface CreateMarketModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: MarketFormData) => Promise<void>
  isSubmitting?: boolean
}

export type MarketFormData =
  | z.infer<typeof priceMarketSchema>
  | z.infer<typeof liquidityMarketSchema>

export function CreateMarketModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: CreateMarketModalProps) {
  const [marketType, setMarketType] = useState<"PRICE" | "LIQUIDITY">("PRICE")
  const [asset, setAsset] = useState<Asset>("BTC")
  const [targetPrice, setTargetPrice] = useState("")
  const [targetLiquidity, setTargetLiquidity] = useState("")
  const [deadline, setDeadline] = useState("")
  const [liquidityParam, setLiquidityParam] = useState("100")
  const [description, setDescription] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const minDeadline = useMemo(() => {
    const date = new Date()
    date.setHours(date.getHours() + 1)
    return date.toISOString().slice(0, 16)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      setMarketType("PRICE")
      setAsset("BTC")
      setTargetPrice("")
      setTargetLiquidity("")
      setDeadline("")
      setLiquidityParam("100")
      setDescription("")
      setErrors({})
    }
  }, [isOpen])

  const validateForm = (): boolean => {
    const formData =
      marketType === "PRICE"
        ? {
            marketType,
            asset,
            feedId: getPythFeedId(asset), // Include feed ID for validation
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
            feedId: getPythFeedId(asset), // Automatically get Pyth feed ID
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden p-0 gap-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-slate-800/50 flex flex-col">
        {/* Compact Header */}
        <div className="relative overflow-hidden px-6 pt-6 pb-4 bg-gradient-to-br from-primary/15 via-purple-600/15 to-transparent border-b border-white/10">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-full blur-3xl opacity-60" />

          <DialogHeader className="relative space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-purple-600 shadow-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <DialogTitle className="text-2xl font-bold text-white">
                Create Market
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-white/60">
              Configure parameters and launch your prediction market
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <div className="space-y-5">
            {/* Market Type */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-white/90 uppercase tracking-wide">
                Market Type
              </label>
              <Tabs
                value={marketType}
                onValueChange={(value) =>
                  setMarketType(value as "PRICE" | "LIQUIDITY")
                }
              >
                <TabsList className="grid w-full grid-cols-2 bg-slate-900/50 p-1 h-auto gap-1.5 border border-white/5">
                  <TabsTrigger
                    value="PRICE"
                    className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-purple-600 data-[state=active]:shadow-lg h-auto py-2.5 rounded-lg transition-all"
                  >
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span className="font-semibold text-xs">
                        Price Market
                      </span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger
                    value="LIQUIDITY"
                    className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-purple-600 data-[state=active]:shadow-lg h-auto py-2.5 rounded-lg transition-all"
                  >
                    <div className="flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5" />
                      <span className="font-semibold text-xs">
                        Liquidity Market
                      </span>
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
                  className="space-y-4"
                >
                  {/* Asset */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/90">
                      Asset
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {ASSETS.map((assetOption) => (
                        <button
                          key={assetOption}
                          type="button"
                          onClick={() => setAsset(assetOption as Asset)}
                          disabled={isSubmitting}
                          className={`py-2.5 rounded-lg border transition-all text-xs font-bold ${
                            asset === assetOption
                              ? "border-primary bg-gradient-to-br from-primary/20 to-purple-600/20 text-white shadow-md"
                              : "border-white/10 bg-slate-900/30 text-white/50 hover:border-white/20 hover:text-white/80"
                          }`}
                        >
                          {assetOption}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target Price */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/90">
                      Target Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-semibold">
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
                        className="h-11 pl-7 bg-slate-900/50 border-white/10 focus:border-primary/50 text-white font-semibold rounded-lg"
                      />
                    </div>
                    {errors.targetPrice && (
                      <p className="text-red-400 text-xs flex items-center gap-1.5">
                        <span className="w-1 h-1 bg-red-400 rounded-full" />
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
                  className="space-y-4"
                >
                  {/* Target Liquidity */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/90">
                      Target Liquidity
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-semibold">
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
                        className="h-11 pl-7 bg-slate-900/50 border-white/10 focus:border-primary/50 text-white font-semibold rounded-lg"
                      />
                    </div>
                    {errors.targetLiquidity && (
                      <p className="text-red-400 text-xs flex items-center gap-1.5">
                        <span className="w-1 h-1 bg-red-400 rounded-full" />
                        {errors.targetLiquidity}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Date & Time */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/90">
                Deadline
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
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
                    className="h-11 pl-9 bg-slate-900/50 border-white/10 focus:border-primary/50 text-white text-sm rounded-lg"
                  />
                </div>
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    <path
                      strokeWidth="2"
                      strokeLinecap="round"
                      d="M12 6v6l4 2"
                    />
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
                    className="h-11 pl-9 bg-slate-900/50 border-white/10 focus:border-primary/50 text-white text-sm rounded-lg"
                  />
                </div>
              </div>
              {deadline.split("T")[0] && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {["09:00", "12:00", "15:00", "18:00", "23:59"].map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => {
                        const date = deadline.split("T")[0]
                        setDeadline(`${date}T${time}`)
                      }}
                      disabled={isSubmitting}
                      className="px-2 py-0.5 text-xs font-medium text-white/50 hover:text-white bg-slate-800/30 hover:bg-slate-800/60 border border-white/10 rounded transition-all"
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}
              {errors.deadline && (
                <p className="text-red-400 text-xs flex items-center gap-1.5">
                  <span className="w-1 h-1 bg-red-400 rounded-full" />
                  {errors.deadline}
                </p>
              )}
            </div>

            {/* Liquidity Parameter */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/90">
                Liquidity Parameter (b)
              </label>
              <Input
                type="number"
                placeholder="100"
                value={liquidityParam}
                onChange={(e) => setLiquidityParam(e.target.value)}
                disabled={isSubmitting}
                step="1"
                min="1"
                className="h-11 bg-slate-900/50 border-white/10 focus:border-primary/50 text-white font-semibold rounded-lg"
              />
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/20">
                <Info className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-white/70 leading-relaxed">
                  Higher values = more liquidity.{" "}
                  <span className="text-primary font-semibold">
                    Recommended: 50-200
                  </span>
                </p>
              </div>
              {errors.liquidityParam && (
                <p className="text-red-400 text-xs flex items-center gap-1.5">
                  <span className="w-1 h-1 bg-red-400 rounded-full" />
                  {errors.liquidityParam}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="flex items-center justify-between text-xs font-semibold text-white/90">
                <span>Description</span>
                <span
                  className={`text-xs font-normal ${
                    description.length > 180
                      ? "text-amber-400"
                      : "text-white/40"
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
                rows={3}
                className="flex w-full rounded-lg bg-slate-900/50 border border-white/10 px-3 py-2.5 text-sm text-white leading-relaxed transition-all placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary/50 resize-none"
              />
              {errors.description && (
                <p className="text-red-400 text-xs flex items-center gap-1.5">
                  <span className="w-1 h-1 bg-red-400 rounded-full" />
                  {errors.description}
                </p>
              )}
            </div>

            {/* Compact Preview */}
            {(targetPrice || targetLiquidity) && deadline && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-purple-600/10 border border-primary/20"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span className="text-xs font-bold text-primary uppercase tracking-wide">
                    Preview
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-slate-900/40 border border-white/10">
                    <div className="text-white/50 mb-0.5">Type</div>
                    <div className="font-bold text-white">
                      {marketType === "PRICE" ? `${asset} Price` : "Liquidity"}
                    </div>
                  </div>
                  <div className="p-2 rounded bg-slate-900/40 border border-white/10">
                    <div className="text-white/50 mb-0.5">Target</div>
                    <div className="font-bold text-primary">
                      $
                      {marketType === "PRICE"
                        ? parseFloat(targetPrice).toLocaleString()
                        : parseFloat(targetLiquidity).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-2 rounded bg-slate-900/40 border border-white/10">
                    <div className="text-white/50 mb-0.5">Duration</div>
                    <div className="font-bold text-white">
                      {daysUntilDeadline}d
                    </div>
                  </div>
                  <div className="p-2 rounded bg-slate-900/40 border border-white/10">
                    <div className="text-white/50 mb-0.5">Liquidity</div>
                    <div className="font-bold text-white">{liquidityParam}</div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900/50 border-t border-white/10 flex-shrink-0">
          <div className="flex gap-2.5">
            <Button
              variant="outline"
              onClick={() => !isSubmitting && onClose()}
              disabled={isSubmitting}
              className="flex-1 h-11 bg-slate-800/50 hover:bg-slate-800 border-slate-700 text-white font-semibold rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-[2] h-11 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-bold shadow-lg rounded-lg"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span>Creating...</span>
                </div>
              ) : (
                "Launch Market"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
