import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import { Toaster } from "react-hot-toast"
import { AuthProvider } from "@/lib/web3/AuthProvider"
import { WagmiProvider } from "@/lib/web3/WagmiProvider"
import { ErrorBoundary } from "@/components/common"
import { Navbar, Footer } from "@/components/layout"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Prediction Market - BNB Chain",
  description:
    "Decentralized prediction markets on BNB Chain with account abstraction",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable}>
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
