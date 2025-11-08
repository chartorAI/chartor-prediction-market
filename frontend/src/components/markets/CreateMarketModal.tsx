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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { ASSETS, type Asset } from "@/lib/constants"
import { formatBigInt } from "@/lib/utils/format"

// Validation schema for market creation
const priceMarketSchema = z.object({
  marketType: z.literal("PRICE"),
  asset: z.enum(ASSETS),
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

/**
 * CreateMarketModal Component
 *
 * A multi-step form modal for creating new prediction markets.
 * Features:
 * - Market type selection (Price/Liquidity)
 * - Asset selection for Price Markets
 * - Form validation with Zod
 * - Preview section with calculated parameters
 * - Glassmorphism design with animations
 *
 * @example
 * ```tsx
 * <CreateMarketModal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   onSubmit={handleCreateMarket}
 * />
 * ```
 */
interface CreateMarketModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when modal should close */
  onClose: () => void
  /** Callback when form is submitted with validated data */
  onSubmit: (data: MarketFormData) => Promise<void>
  /** Whether the form is currently submitting */
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
  // Form state
  const [marketType, setMarketType] = useState<"PRICE" | "LIQUIDITY">("PRICE")
  const [asset, setAsset] = useState<Asset>("BTC")
  const [targetPrice, setTargetPrice] = useState("")
  const [targetLiquidity, setTargetLiquidity] = useState("")
  const [deadline, setDeadline] = useState("")
  const [liquidityParam, setLiquidityParam] = useState("100")
  const [description, setDescription] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Get minimum datetime for deadline (current time + 1 hour)
  const minDeadline = useMemo(() => {
    const date = new Date()
    date.setHours(date.getHours() + 1)
    return date.toISOString().slice(0, 16)
  }, [])

  // Reset form when modal closes
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

  // Validate form
  const validateForm = (): boolean => {
    const formData =
      marketType === "PRICE"
        ? {
            marketType,
            asset,
            targetPrice,
            deadline,
            liquidityParam,
            description,
          }
        : {
            marketType,
            targetLiquidity,
            deadline,
            liquidityParam,
            description,
          }

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

  const handleCancel = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  // Calculate preview values
  const deadlineDate = deadline ? new Date(deadline) : null
  const daysUntilDeadline = deadlineDate
    ? Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <DialogHeader>
              <DialogTitle className="text-2xl">Create New Market</DialogTitle>
              <DialogDescription className="text-text-secondary">
                Create a new prediction market for traders to participate in
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-6">
              {/* Market Type Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">
                  Market Type
                </label>
                <Tabs
                  value={marketType}
                  onValueChange={(value) =>
                    setMarketType(value as "PRICE" | "LIQUIDITY")
                  }
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="PRICE">Price Market</TabsTrigger>
                    <TabsTrigger value="LIQUIDITY">
                      Liquidity Market
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Price Market Fields */}
              {marketType === "PRICE" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  {/* Asset Selection */}
                  <div className="space-y-2">
                    <label
                      htmlFor="asset"
                      className="text-sm font-medium text-text-primary"
                    >
                      Asset
                    </label>
                    <select
                      id="asset"
                      value={asset}
                      onChange={(e) => setAsset(e.target.value as Asset)}
                      disabled={isSubmitting}
                      className="flex h-9 w-full rounded-md bg-glass-medium backdrop-blur-md border border-border-medium px-3 py-1 text-sm text-text-primary shadow-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {ASSETS.map((assetOption) => (
                        <option key={assetOption} value={assetOption}>
                          {assetOption}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Target Price */}
                  <div className="space-y-2">
                    <label
                      htmlFor="targetPrice"
                      className="text-sm font-medium text-text-primary"
                    >
                      Target Price (USD)
                    </label>
                    <Input
                      id="targetPrice"
                      type="number"
                      placeholder="e.g., 50000"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      disabled={isSubmitting}
                      step="0.01"
                      min="0"
                    />
                    {errors.targetPrice && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-error text-sm"
                      >
                        {errors.targetPrice}
                      </motion.p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Liquidity Market Fields */}
              {marketType === "LIQUIDITY" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  {/* Target Liquidity */}
                  <div className="space-y-2">
                    <label
                      htmlFor="targetLiquidity"
                      className="text-sm font-medium text-text-primary"
                    >
                      Target Liquidity (USD)
                    </label>
                    <Input
                      id="targetLiquidity"
                      type="number"
                      placeholder="e.g., 1000000"
                      value={targetLiquidity}
                      onChange={(e) => setTargetLiquidity(e.target.value)}
                      disabled={isSubmitting}
                      step="0.01"
                      min="0"
                    />
                    {errors.targetLiquidity && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-error text-sm"
                      >
                        {errors.targetLiquidity}
                      </motion.p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Common Fields */}
              {/* Deadline */}
              <div className="space-y-2">
                <label
                  htmlFor="deadline"
                  className="text-sm font-medium text-text-primary"
                >
                  Deadline
                </label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  disabled={isSubmitting}
                  min={minDeadline}
                />
                {errors.deadline && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-error text-sm"
                  >
                    {errors.deadline}
                  </motion.p>
                )}
              </div>

              {/* Liquidity Parameter */}
              <div className="space-y-2">
                <label
                  htmlFor="liquidityParam"
                  className="text-sm font-medium text-text-primary"
                >
                  Liquidity Parameter (b)
                </label>
                <Input
                  id="liquidityParam"
                  type="number"
                  placeholder="e.g., 100"
                  value={liquidityParam}
                  onChange={(e) => setLiquidityParam(e.target.value)}
                  disabled={isSubmitting}
                  step="1"
                  min="1"
                />
                <p className="text-xs text-text-secondary">
                  Controls market sensitivity. Higher values = more liquidity,
                  less price movement per trade. Recommended: 50-200 for most
                  markets.
                </p>
                {errors.liquidityParam && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-error text-sm"
                  >
                    {errors.liquidityParam}
                  </motion.p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label
                  htmlFor="description"
                  className="text-sm font-medium text-text-primary flex justify-between"
                >
                  <span>Description</span>
                  <span className="text-xs text-text-secondary">
                    {description.length}/200
                  </span>
                </label>
                <textarea
                  id="description"
                  placeholder="Describe the market prediction..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSubmitting}
                  maxLength={200}
                  rows={3}
                  className="flex w-full rounded-md bg-glass-medium backdrop-blur-md border border-border-medium px-3 py-2 text-sm text-text-primary shadow-sm transition-all placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
                {errors.description && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-error text-sm"
                  >
                    {errors.description}
                  </motion.p>
                )}
              </div>

              {/* Preview Section */}
              {(targetPrice || targetLiquidity) && deadline && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 p-4 rounded-lg bg-glass-light border border-border-subtle"
                >
                  <h3 className="text-sm font-semibold text-text-primary">
                    Market Preview
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Type</span>
                      <span className="text-text-primary font-medium">
                        {marketType === "PRICE"
                          ? `${asset} Price Market`
                          : "BNB/USDT Liquidity Market"}
                      </span>
                    </div>
                    {marketType === "PRICE" && targetPrice && (
                      <div className="flex justify-between">
                        <span className="text-text-secondary">
                          Target Price
                        </span>
                        <span className="text-text-primary font-medium">
                          ${parseFloat(targetPrice).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {marketType === "LIQUIDITY" && targetLiquidity && (
                      <div className="flex justify-between">
                        <span className="text-text-secondary">
                          Target Liquidity
                        </span>
                        <span className="text-text-primary font-medium">
                          ${parseFloat(targetLiquidity).toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Duration</span>
                      <span className="text-text-primary font-medium">
                        {daysUntilDeadline} day
                        {daysUntilDeadline !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">
                        Liquidity Param
                      </span>
                      <span className="text-text-primary font-medium">
                        {liquidityParam}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full sm:w-auto min-w-[140px]"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    <span>Creating...</span>
                  </div>
                ) : (
                  "Create Market"
                )}
              </Button>
            </DialogFooter>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
