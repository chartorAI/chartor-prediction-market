import type { Metadata } from "next"
import { Outfit } from "next/font/google"
import localFont from "next/font/local"
import Script from "next/script"
import "./globals.css"
import { Toaster } from "react-hot-toast"
import { AuthProvider } from "@/lib/web3/AuthProvider"
import { WagmiProvider } from "@/lib/web3/WagmiProvider"
import { ErrorBoundary } from "@/components/common"
import { Navbar, Footer } from "@/components/layout"

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
})

const ethnocentric = localFont({
  src: "./fonts/eth.otf",
  variable: "--font-ethnocentric",
})

export const metadata: Metadata = {
  title: "Chartor Prediction Market - Predict & Earn on BNB Chain",
  description:
    "Decentralized prediction markets powered by Pyth oracles and PancakeSwap on BNB Chain. Predict prices, forecast liquidity, and earn rewards.",
  keywords: [
    "prediction market",
    "BNB Chain",
    "DeFi",
    "Pyth oracle",
    "PancakeSwap",
    "LMSR",
    "crypto trading",
    "decentralized finance",
  ],
  authors: [{ name: "Chartor AI" }],
  creator: "Chartor AI",
  publisher: "Chartor AI",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://prediction.chartor.ai",
    siteName: "Chartor Prediction Market",
    title: "Chartor Prediction Market - Predict & Earn on BNB Chain",
    description:
      "Decentralized prediction markets powered by Pyth oracles and PancakeSwap. Predict prices, forecast liquidity, and earn rewards on BNB Chain.",
  },
  twitter: {
    card: "summary",
    title: "Chartor Prediction Market - Predict & Earn on BNB Chain",
    description:
      "Decentralized prediction markets powered by Pyth oracles and PancakeSwap. Predict prices, forecast liquidity, and earn rewards.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${ethnocentric.variable}`}>
      <body className="antialiased flex flex-col min-h-screen">
        <Script src="https://s3.tradingview.com/tv.js" strategy="lazyOnload" />
        <ErrorBoundary>
          <WagmiProvider>
            <AuthProvider>
              <Navbar />
              <main className="flex-1 pt-16">{children}</main>
              <Footer />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: "rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(20px)",
                    color: "#fff",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "1rem",
                  },
                  success: {
                    iconTheme: {
                      primary: "#10b981",
                      secondary: "#fff",
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: "#ef4444",
                      secondary: "#fff",
                    },
                  },
                }}
              />
            </AuthProvider>
          </WagmiProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
