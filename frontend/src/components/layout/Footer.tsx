"use client"

import Link from "next/link"
import { Github, Twitter, MessageCircle } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  const socialLinks = [
    {
      label: "Twitter",
      href: "#",
      icon: Twitter,
    },
    {
      label: "Discord",
      href: "#",
      icon: MessageCircle,
    },
    {
      label: "GitHub",
      href: "#",
      icon: Github,
    },
  ]

  return (
    <footer className="border-t border-border-subtle mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Brand */}
          <div className="text-text-secondary text-sm">
            © {currentYear} Prediction Market
          </div>

          {/* Social Links */}
          <div className="flex items-center space-x-6">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-secondary hover:text-primary transition-colors"
                aria-label={social.label}
              >
                <social.icon className="w-5 h-5" />
              </a>
            ))}
          </div>

          {/* Chain Info */}
          <div className="text-text-secondary text-sm">Built on BNB Chain</div>
        </div>
      </div>
    </footer>
  )
}
