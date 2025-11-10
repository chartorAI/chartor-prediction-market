"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { useAuthStore } from "@/stores/authStore"
import { ConnectButton } from "@/components/web3/ConnectButton"
import { cn } from "@/lib/utils/cn"

interface NavbarProps {
  className?: string
}

export function Navbar({ className }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { isAuthenticated } = useAuthStore()

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Price Markets", href: "/markets/price" },
    { label: "Liquidity Markets", href: "/markets/liquidity" },
  ]

  const isActiveTab = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname?.startsWith(href)
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
            <img src="/trianglelogo.svg" alt="Logo" className="h-8 w-auto" />
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

            {/* Connect Button */}
            <ConnectButton />
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

            {/* Connect Button */}
            <div className="pt-4 border-t border-white/10">
              <ConnectButton />
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
