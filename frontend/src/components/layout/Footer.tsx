"use client"

import Link from "next/link"
import { Globe } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  const footerColumns = [
    {
      title: "Markets",
      links: [
        { name: "Price Markets", href: "/markets/price" },
        { name: "Liquidity Markets", href: "/markets/liquidity" },
      ],
    },
  ]

  return (
    <footer className="py-10 md:py-16 px-4 sm:px-6 lg:px-8 border-t bg-[#191818] border-white/10 mt-auto">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
          {/* Brand Section */}
          <div>
            <Link
              href="/"
              className="flex items-center space-x-2 mb-4 hover:opacity-80 transition-opacity"
            >
              <img
                src="/logo.svg"
                alt="Logo"
                className="h-10 sm:h-12 md:h-14 w-auto"
              />
            </Link>
            <p className="text-white/60 text-sm">
              Chartor AI - Decentralized prediction markets on BNB Chain
            </p>
          </div>

          {/* Footer Links - Horizontal */}
          <div className="flex flex-wrap items-center gap-6">
            {footerColumns[0].links.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="h-px w-full bg-white/10 mb-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/60 text-sm">
            © {currentYear} Chartor AI. All rights reserved.
          </p>
          <p className="text-white/60 text-sm flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Built on BNB Chain
          </p>
        </div>
      </div>
    </footer>
  )
}
