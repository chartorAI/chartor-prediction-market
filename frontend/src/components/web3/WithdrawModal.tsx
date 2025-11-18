"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { X, ArrowDownToLine } from "lucide-react"
import { useWithdraw } from "@/lib/hooks/useWithdraw"
import { useBalance } from "@/lib/hooks/useBalance"
import { formatBigInt } from "@/lib/utils/format"
import { cn } from "@/lib/utils/cn"

interface WithdrawModalProps {
  isOpen: boolean
  onClose: () => void
}

export function WithdrawModal({ isOpen, onClose }: WithdrawModalProps) {
  const [toAddress, setToAddress] = useState("")
  const [amount, setAmount] = useState("")
  const [mounted, setMounted] = useState(false)
  const { withdraw, isWithdrawing } = useWithdraw()
  const { balance } = useBalance()

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  const handleWithdraw = async () => {
    const result = await withdraw(toAddress, amount)
    setToAddress("")
    setAmount("")
    onClose()
  }

  const handleMaxClick = () => {
    console.log("MAX clicked, balance:", balance?.toString())
    if (balance && balance > BigInt(0)) {
      const balanceInBnb = Number(balance) / 1e18
      console.log("Balance in BNB:", balanceInBnb)

      const maxAmount = balanceInBnb - 0.001
      console.log("Max amount after gas:", maxAmount)

      if (maxAmount > 0) {
        setAmount(maxAmount.toFixed(6))
      } else {
        setAmount("0")
      }
    }
  }

  if (!isOpen || !mounted) return null

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10">
        {/* Header */}
        <div className="relative p-6 border-b border-white/10 bg-gradient-to-br from-primary/10 to-purple-600/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
                <ArrowDownToLine className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Withdraw Funds</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Balance Display */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-xs text-white/60 mb-1">Available Balance</div>
            <div className="text-2xl font-bold text-white font-mono">
              {balance ? formatBigInt(balance, 18, 6) : "0.000000"} BNB
            </div>
          </div>

          {/* To Address Input */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Recipient Address
            </label>
            <input
              type="text"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              placeholder="0x..."
              className={cn(
                "w-full px-4 py-3 rounded-lg",
                "bg-white/5 border border-white/10",
                "text-white placeholder:text-white/40",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
                "transition-all font-mono text-sm"
              )}
            />
          </div>

          {/* Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-white/80">
                Amount (BNB)
              </label>
              <button
                onClick={handleMaxClick}
                className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                MAX
              </button>
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              step="0.000001"
              min="0"
              className={cn(
                "w-full px-4 py-3 rounded-lg",
                "bg-white/5 border border-white/10",
                "text-white placeholder:text-white/40",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
                "transition-all font-mono text-lg"
              )}
            />
          </div>

          {/* Warning */}
          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-xs text-yellow-200/80">
              ⚠️ Make sure the recipient address is correct. Transactions cannot
              be reversed.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isWithdrawing}
              className={cn(
                "flex-1 px-4 py-3 rounded-lg font-semibold",
                "bg-white/5 border border-white/10 text-white/80",
                "hover:bg-white/10 hover:text-white",
                "transition-all",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              Cancel
            </button>
            <button
              onClick={handleWithdraw}
              disabled={isWithdrawing || !toAddress || !amount}
              className={cn(
                "flex-1 px-4 py-3 rounded-lg font-semibold",
                "bg-gradient-to-r from-primary to-purple-600",
                "hover:from-primary/90 hover:to-purple-600/90",
                "text-white shadow-lg shadow-primary/25",
                "transition-all",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isWithdrawing ? "Withdrawing..." : "Withdraw"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
