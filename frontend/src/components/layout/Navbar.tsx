"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Plus } from "lucide-react"
import { useAuth } from "@/lib/web3/AuthProvider"
import { useAuthStore } from "@/stores/authStore"
import { Button } from "@/components/ui/button"
import { truncateAddress } from "@/lib/utils/format"
import { cn } from "@/lib/utils/cn"

interface NavbarProps {
  className?: string
}

export function Navbar({ className }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { login, logout } = useAuth()
  const { isAuthenticated, userAddress, isLoading } = useAuthStore()

  const marketTabs = [
    { label: "Price Markets", href: "/markets/price" },
    { label: "Liquidity Markets", href: "/markets/liquidity" },
  ]

  const isActiveTab = (href: string) => pathname?.startsWith(href)

  const handleLogin = async () => {
    try {
      await login()
    } catch (error) {
      console.error("Login error:", error)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 glass-medium border-b border-border-subtle",
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
            <span className="text-xl font-bold text-white">
              Prediction Market
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Market Type Tabs */}
            <div className="flex items-center space-x-2 glass px-2 py-1 rounded-lg">
              {marketTabs.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium transition-all",
                    isActiveTab(tab.href)
                      ? "bg-primary text-white shadow-glow"
                      : "text-text-secondary hover:text-text-primary hover:bg-glass-medium"
                  )}
                >
                  {tab.label}
                </Link>
              ))}
            </div>

            {/* My Positions Link */}
            {isAuthenticated && (
              <Link
                href="/positions"
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-all",
                  pathname === "/positions"
                    ? "text-primary"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                My Positions
              </Link>
            )}

            {/* Create Market Button */}
            {isAuthenticated && (
              <Button
                variant="outline"
                size="sm"
                className="glass-button border-primary/50 hover:border-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Market
              </Button>
            )}

            {/* Auth Button */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="glass px-4 py-2 rounded-lg">
                  <span className="text-sm font-mono text-text-primary">
                    {truncateAddress(userAddress || "")}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="glass-button"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleLogin}
                disabled={isLoading}
                className="bg-primary hover:bg-primary-light transition-colors"
              >
                {isLoading ? "Connecting..." : "Sign In"}
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
        <div className="md:hidden glass-medium border-t border-border-subtle animate-slide-down">
          <div className="px-4 py-4 space-y-4">
            {/* Market Type Tabs */}
            <div className="space-y-2">
              <p className="text-xs text-text-secondary uppercase tracking-wider px-2">
                Markets
              </p>
              {marketTabs.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block px-4 py-3 rounded-lg text-sm font-medium transition-all",
                    isActiveTab(tab.href)
                      ? "bg-primary text-white shadow-glow"
                      : "text-text-secondary hover:text-text-primary hover:bg-glass-medium"
                  )}
                >
                  {tab.label}
                </Link>
              ))}
            </div>

            {/* My Positions Link */}
            {isAuthenticated && (
              <div className="space-y-2">
                <Link
                  href="/positions"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block px-4 py-3 rounded-lg text-sm font-medium transition-all",
                    pathname === "/positions"
                      ? "bg-primary text-white shadow-glow"
                      : "text-text-secondary hover:text-text-primary hover:bg-glass-medium"
                  )}
                >
                  My Positions
                </Link>
              </div>
            )}

            {/* Create Market Button */}
            {isAuthenticated && (
              <Button
                variant="outline"
                className="w-full glass-button border-primary/50 hover:border-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Market
              </Button>
            )}

            {/* Auth Section */}
            <div className="pt-4 border-t border-border-subtle space-y-3">
              {isAuthenticated ? (
                <>
                  <div className="glass px-4 py-3 rounded-lg">
                    <p className="text-xs text-text-secondary mb-1">
                      Wallet Address
                    </p>
                    <p className="text-sm font-mono text-text-primary">
                      {truncateAddress(userAddress || "")}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full glass-button"
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
                  className="w-full bg-primary hover:bg-primary-light transition-colors"
                >
                  {isLoading ? "Connecting..." : "Sign In"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
