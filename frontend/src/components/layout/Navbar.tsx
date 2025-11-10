"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Wallet, Copy, Check } from "lucide-react"
import { useAuth } from "@/lib/web3/AuthProvider"
import { useAuthStore } from "@/stores/authStore"
import { useBalance } from "@/lib/hooks/useBalance"
import { Button } from "@/components/ui/button"
import { truncateAddress, formatBigInt } from "@/lib/utils/format"
import { cn } from "@/lib/utils/cn"
import { toast } from "react-hot-toast"

interface NavbarProps {
  className?: string
}

export function Navbar({ className }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const pathname = usePathname()
  const { login, logout } = useAuth()
  const { isAuthenticated, userAddress, isLoading } = useAuthStore()
  const { balance, isLoading: balanceLoading } = useBalance()

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Price Markets", href: "/markets/price" },
    { label: "Liquidity Markets", href: "/markets/liquidity" },
  ]

  const isActiveTab = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname?.startsWith(href)
  }

  const handleLogin = async () => {
    try {
      await login()
    } catch (error: any) {
      console.error("Login error:", {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        stack: error?.stack,
        raw: error,
      })
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const handleCopyAddress = async () => {
    if (!userAddress) return

    try {
      await navigator.clipboard.writeText(userAddress)
      setCopied(true)
      toast.success("Address copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy address:", error)
      toast.error("Failed to copy address")
    }
  }

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent-blue flex items-center justify-center">
              <span className="text-white font-bold text-sm">PM</span>
            </div>
            <span className="text-xl font-bold text-white hidden sm:block">
              Prediction Market
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {/* Navigation Links */}
            <nav className="flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isActiveTab(item.href)
                      ? "text-white"
                      : "text-white/60 hover:text-white"
                  )}
                >
                  {item.label}
                </Link>
              ))}
              {isAuthenticated && (
                <Link
                  href="/positions"
                  className={cn(
                    "text-sm font-medium transition-colors",
                    pathname === "/positions"
                      ? "text-white"
                      : "text-white/60 hover:text-white"
                  )}
                >
                  My Positions
                </Link>
              )}
            </nav>

            {/* Auth Section */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {/* Balance Display */}
                <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-full flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-primary" />
                  <span className="text-sm font-mono text-white">
                    {balanceLoading || balance === null
                      ? "..."
                      : `${formatBigInt(balance, 18, 4)} BNB`}
                  </span>
                </div>
                {/* Address Display */}
                <button
                  onClick={handleCopyAddress}
                  className="bg-white/5 border border-white/10 px-4 py-2 rounded-full hover:bg-white/10 transition-all flex items-center gap-2 group"
                  title="Click to copy address"
                >
                  <span className="text-sm font-mono text-white">
                    {truncateAddress(userAddress || "")}
                  </span>
                  {copied ? (
                    <Check className="w-3 h-3 text-success" />
                  ) : (
                    <Copy className="w-3 h-3 text-white/60 group-hover:text-primary transition-colors" />
                  )}
                </button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="border-white/20 hover:bg-white/10"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleLogin}
                disabled={isLoading}
                className="bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-full font-medium transition-colors"
              >
                {isLoading ? "Connecting..." : "Connect Wallet"}
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden glass-button p-2"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-sm border-t border-white/10 animate-slide-down">
          <div className="px-4 py-4 space-y-4">
            {/* Navigation Links */}
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block px-4 py-3 rounded-lg text-sm font-medium transition-all",
                    isActiveTab(item.href)
                      ? "bg-primary text-white"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  {item.label}
                </Link>
              ))}
              {isAuthenticated && (
                <Link
                  href="/positions"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block px-4 py-3 rounded-lg text-sm font-medium transition-all",
                    pathname === "/positions"
                      ? "bg-primary text-white"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  My Positions
                </Link>
              )}
            </nav>

            {/* Auth Section */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              {isAuthenticated ? (
                <>
                  {/* Balance Display */}
                  <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-lg">
                    <p className="text-xs text-white/60 mb-1 flex items-center gap-1">
                      <Wallet className="w-3 h-3" />
                      Balance
                    </p>
                    <p className="text-sm font-mono text-white">
                      {balanceLoading || balance === null
                        ? "Loading..."
                        : `${formatBigInt(balance, 18, 4)} BNB`}
                    </p>
                  </div>
                  {/* Wallet Address */}
                  <button
                    onClick={handleCopyAddress}
                    className="bg-white/5 border border-white/10 px-4 py-3 rounded-lg w-full text-left hover:bg-white/10 transition-all"
                  >
                    <p className="text-xs text-white/60 mb-1 flex items-center justify-between">
                      <span>Wallet Address</span>
                      {copied ? (
                        <Check className="w-3 h-3 text-success" />
                      ) : (
                        <Copy className="w-3 h-3 text-white/60" />
                      )}
                    </p>
                    <p className="text-sm font-mono text-white">
                      {truncateAddress(userAddress || "")}
                    </p>
                  </button>
                  <Button
                    variant="outline"
                    className="w-full border-white/20 hover:bg-white/10"
                    onClick={handleLogout}
                    disabled={isLoading}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-full font-medium transition-colors"
                >
                  {isLoading ? "Connecting..." : "Connect Wallet"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
