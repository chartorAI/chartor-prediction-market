"use client"

import { useState, useRef, useEffect } from "react"
import { Wallet, LogOut, Copy, Check, ChevronDown, User } from "lucide-react"
import { useAuth } from "@/lib/web3/AuthProvider"
import { useAuthStore } from "@/stores/authStore"
import { useBalance } from "@/lib/hooks/useBalance"
import { truncateAddress, formatBigInt } from "@/lib/utils/format"
import { cn } from "@/lib/utils/cn"
import { toast } from "react-hot-toast"

export function ConnectButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { login, logout } = useAuth()
  const { isAuthenticated, userAddress, isLoading } = useAuthStore()
  const { balance, isLoading: balanceLoading } = useBalance()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogin = async () => {
    try {
      await login()
    } catch (error: any) {
      console.error("Login error:", error)
      toast.error("Failed to connect wallet")
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      setIsOpen(false)
      toast.success("Disconnected")
    } catch (error) {
      console.error("Logout error:", error)
      toast.error("Failed to disconnect")
    }
  }

  const handleCopyAddress = async () => {
    if (!userAddress) return

    try {
      await navigator.clipboard.writeText(userAddress)
      setCopied(true)
      toast.success("Address copied!")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy address:", error)
      toast.error("Failed to copy address")
    }
  }

  // Not connected state
  if (!isAuthenticated) {
    return (
      <div className="relative group">
        {/* Glow effect behind button */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-purple-600 rounded-lg blur opacity-30 group-hover:opacity-60 transition-opacity duration-500" />

        {/* Button */}
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className={cn(
            "relative px-5 py-2.5 rounded-lg font-semibold transition-all text-sm",
            "bg-gradient-to-r from-primary to-purple-600",
            "hover:from-primary/90 hover:to-purple-600/90",
            "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "flex items-center gap-2 text-white"
          )}
        >
          <Wallet className="w-4 h-4" />
          <span>{isLoading ? "Logging in..." : "Login"}</span>
        </button>
      </div>
    )
  }

  // Connected state with dropdown
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
          "bg-slate-900/50 border border-white/10",
          "hover:bg-slate-800/50 hover:border-white/20"
        )}
      >
        {/* Balance */}
        <div className="flex items-center gap-1.5">
          <Wallet className="w-3.5 h-3.5 text-primary" />
          <span className="font-mono text-xs font-semibold text-white">
            {balanceLoading || balance === null
              ? "..."
              : formatBigInt(balance, 18, 6)}
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-white/20" />

        {/* Address */}
        <span className="font-mono text-xs font-medium text-white/80">
          {truncateAddress(userAddress || "", 4)}
        </span>

        {/* Chevron */}
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-white/60 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            "absolute right-0 mt-2 w-72 rounded-xl overflow-hidden",
            "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950",
            "border border-white/10 shadow-2xl shadow-black/50",
            "animate-slide-down"
          )}
        >
          {/* Header with gradient */}
          <div className="relative overflow-hidden p-4 bg-gradient-to-br from-primary/10 to-purple-600/10 border-b border-white/10">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl" />
            <div className="relative">
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-2">
                Connected Account
              </p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-white font-medium">
                      {truncateAddress(userAddress || "", 6)}
                    </span>
                    <button
                      onClick={handleCopyAddress}
                      className="p-1 rounded hover:bg-white/10 transition-colors"
                      title="Copy address"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-white/60" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Balance Info */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wide">
                Wallet Balance
              </p>
              <div className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                <span className="text-xs font-bold text-primary">BNB</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-purple-600/10 border border-primary/20">
                <Wallet className="w-4 h-4 text-primary" />
              </div>
              <span className="font-mono text-xl font-bold text-white">
                {balanceLoading || balance === null
                  ? "..."
                  : formatBigInt(balance, 18, 6)}
              </span>
            </div>
            <p className="text-xs text-white/40 mt-2 ml-11">
              Available for trading
            </p>
          </div>

          {/* Actions */}
          <div className="p-2">
            <button
              onClick={handleLogout}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg",
                "text-sm font-semibold text-white/80 hover:text-white",
                "hover:bg-red-500/10 hover:border-red-500/20 border border-transparent",
                "transition-all group"
              )}
            >
              <div className="p-1.5 rounded-md bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                <LogOut className="w-4 h-4 text-red-400" />
              </div>
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
