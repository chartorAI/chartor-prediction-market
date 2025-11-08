"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowRight,
  TrendingUp,
  Droplets,
  BarChart3,
  Shield,
  Zap,
  Users,
} from "lucide-react"
import { useMarkets } from "@/lib/hooks/useMarkets"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { MarketCard } from "@/components/markets/MarketCard"

export default function Home() {
  const { allMarkets, isLoading } = useMarkets()

  // Calculate quick stats
  const activeMarkets = allMarkets.filter((m) => !m.resolved)
  const priceMarkets = activeMarkets.filter((m) => m.type === "PRICE")
  const liquidityMarkets = activeMarkets.filter((m) => m.type === "LIQUIDITY")

  // Calculate total volume (sum of qYes + qNo for all markets)
  const totalVolume = allMarkets.reduce(
    (sum, market) => sum + market.qYes + market.qNo,
    BigInt(0)
  )

  // Get recent markets (sorted by deadline, most recent first)
  const recentMarkets = [...activeMarkets]
    .sort((a, b) => b.deadline - a.deadline)
    .slice(0, 6)

  const features = [
    {
      icon: TrendingUp,
      title: "Price Predictions",
      description:
        "Predict future prices of BTC, ETH, BNB, GOLD, and OIL with real-time Pyth oracle data",
    },
    {
      icon: Droplets,
      title: "Liquidity Markets",
      description:
        "Forecast PancakeSwap pool liquidity using on-chain data from PancakeV3",
    },
    {
      icon: Shield,
      title: "Secure & Transparent",
      description:
        "Smart contracts audited and deployed on BNB Chain for maximum security",
    },
    {
      icon: Zap,
      title: "Instant Settlement",
      description:
        "Automated market resolution with instant payouts using oracle price feeds",
    },
    {
      icon: BarChart3,
      title: "LMSR Algorithm",
      description:
        "Logarithmic Market Scoring Rule ensures fair pricing and deep liquidity",
    },
    {
      icon: Users,
      title: "Community Driven",
      description:
        "Anyone can create markets and participate in decentralized predictions",
    },
  ]

  return (
    <main className="min-h-screen bg-background-primary">
      {/* Hero Section */}
      <section className="pt-32 md:pt-40 pb-20 md:pb-32 px-4 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Predict the Future.
              <br />
              <span className="text-gradient bg-gradient-to-r from-primary via-purple-500 to-accent-blue bg-clip-text text-transparent">
                Earn Rewards.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 mb-8 max-w-3xl mx-auto">
              Decentralized prediction markets powered by Pyth oracles and
              PancakeSwap on BNB Chain
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="/markets/price">
                <motion.button
                  className="bg-primary hover:bg-primary/80 text-white px-8 py-4 rounded-full text-lg font-medium transition-all flex items-center gap-2 shadow-glow"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Explore Markets
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
              <Link href="#how-it-works">
                <motion.button
                  className="bg-white/5 border border-white/20 hover:bg-white/10 text-white px-8 py-4 rounded-full text-lg font-medium transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  How It Works
                </motion.button>
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <motion.div
                className="bg-white/5 border border-white/10 backdrop-blur-xl p-6 rounded-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="text-4xl font-bold text-white mb-2">
                  {activeMarkets.length}
                </div>
                <div className="text-white/60">Active Markets</div>
              </motion.div>
              <motion.div
                className="bg-white/5 border border-white/10 backdrop-blur-xl p-6 rounded-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="text-4xl font-bold text-white mb-2">
                  {(Number(totalVolume) / 1e18).toFixed(2)}
                </div>
                <div className="text-white/60">Total Volume (BNB)</div>
              </motion.div>
              <motion.div
                className="bg-white/5 border border-white/10 backdrop-blur-xl p-6 rounded-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="text-4xl font-bold text-white mb-2">
                  {priceMarkets.length + liquidityMarkets.length}
                </div>
                <div className="text-white/60">Total Predictions</div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />
      </section>

      {/* Market Types Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Choose Your Market
            </h2>
            <p className="text-white/60 text-lg">
              Two types of prediction markets to explore
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Link href="/markets/price">
              <motion.div
                className="bg-white/5 border border-white/10 backdrop-blur-xl p-8 rounded-3xl hover:bg-white/10 hover:border-primary/50 transition-all cursor-pointer group relative overflow-hidden"
                whileHover={{ y: -5 }}
              >
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mb-6">
                    <TrendingUp className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-primary transition-colors">
                    Price Markets
                  </h3>
                  <p className="text-white/60 mb-6">
                    Predict future prices of BTC, ETH, BNB, GOLD, and OIL using
                    Pyth oracle data
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-semibold">
                      {priceMarkets.length} active markets
                    </span>
                    <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            </Link>

            <Link href="/markets/liquidity">
              <motion.div
                className="bg-white/5 border border-white/10 backdrop-blur-xl p-8 rounded-3xl hover:bg-white/10 hover:border-primary/50 transition-all cursor-pointer group relative overflow-hidden"
                whileHover={{ y: -5 }}
              >
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center mb-6">
                    <Droplets className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-primary transition-colors">
                    Liquidity Markets
                  </h3>
                  <p className="text-white/60 mb-6">
                    Forecast BNB/USDT pool liquidity on PancakeSwap V3 using
                    on-chain data
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-semibold">
                      {liquidityMarkets.length} active markets
                    </span>
                    <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="how-it-works"
        className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-[#191818]"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center space-x-6 mb-6">
              <div
                className="h-[3px] w-16 md:w-32"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(151, 103, 255, 0) 32.7%, #FFFFFF 95%, #3F1A8F 100%)",
                }}
              />
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Why Choose Us
              </h2>
              <div
                className="h-[3px] w-16 md:w-32 rotate-180"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(151, 103, 255, 0) 32.7%, #FFFFFF 95%, #3F1A8F 100%)",
                }}
              />
            </div>
            <p className="text-white/60 text-lg">
              Built with cutting-edge technology for the best prediction market
              experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-white/60">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Active Markets Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Active Prediction Markets
            </h2>
            <p className="text-white/60 text-lg">
              Join thousands of traders making predictions
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : recentMarkets.length === 0 ? (
            <div className="text-center py-16 bg-white/5 border border-white/10 rounded-3xl">
              <p className="text-white/60 text-lg mb-4">
                No active markets yet
              </p>
              <p className="text-white/40 text-sm">
                Check back soon for new prediction markets
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentMarkets.map((market, index) => (
                <motion.div
                  key={market.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <MarketCard
                    market={market}
                    showTradingButtons={false}
                    linkTo={
                      market.type === "PRICE"
                        ? `/markets/price/${market.asset.toLowerCase()}`
                        : "/markets/liquidity"
                    }
                    className="cursor-pointer group"
                  />
                </motion.div>
              ))}
            </div>
          )}

          {recentMarkets.length > 0 && (
            <div className="text-center mt-12">
              <Link href="/markets/price">
                <motion.button
                  className="bg-white/5 border border-white/20 hover:bg-white/10 hover:border-primary text-white px-8 py-3 rounded-full font-medium transition-all inline-flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  View All Markets
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
