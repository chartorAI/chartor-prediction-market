const { expect } = require("chai")
const { ethers } = require("hardhat")

/**
 * Market Stat test
 *
 * Run with: npx hardhat test test/MarketStat.testnet.js --network bnbTestnet
 *
 * Requirements: NO tBNB needed - all read operations are free!
 */
describe("Market Stat test", function () {
    let predictionMarket, liquidityMarket
    let owner

    const PREDICTION_MARKET_ADDRESS = "0x2A5D9E8A416e889BdCA0913fE04426E484Cb576c"
    const LIQUIDITY_MARKET_ADDRESS = "0x532EFA808095B01BB72FadE65A0697881de0fE14"

    before(async function () {
        ;[owner] = await ethers.getSigners()

        // Connect to deployed contracts
        const PredictionMarket = await ethers.getContractFactory("PredictionMarket")
        predictionMarket = PredictionMarket.attach(PREDICTION_MARKET_ADDRESS)

        const LiquidityMarket = await ethers.getContractFactory("LiquidityMarket")
        liquidityMarket = LiquidityMarket.attach(LIQUIDITY_MARKET_ADDRESS)

        console.log("\n=== Connected to Testnet Contracts ===")
        console.log("PredictionMarket:", PREDICTION_MARKET_ADDRESS)
        console.log("LiquidityMarket:", LIQUIDITY_MARKET_ADDRESS)
        console.log("Your address:", owner.address)

        const balance = await ethers.provider.getBalance(owner.address)
        console.log("Your tBNB balance:", ethers.formatEther(balance), "tBNB")
        console.log("=====================================\n")
    })

    describe("PredictionMarket - Read State", function () {
        it("should get market count", async function () {
            const count = await predictionMarket.getMarketCount()
            console.log("📊 Total markets:", count.toString())
            expect(count).to.be.a("bigint")
        })

        it("should get active markets", async function () {
            const activeMarkets = await predictionMarket.getActiveMarkets()
            console.log("✅ Active markets:", activeMarkets.length)

            if (activeMarkets.length > 0) {
                console.log("   Market IDs:", activeMarkets.map((id) => id.toString()).join(", "))
            }
        })

        it("should get resolved markets", async function () {
            const resolvedMarkets = await predictionMarket.getResolvedMarkets()
            console.log("🏁 Resolved markets:", resolvedMarkets.length)
        })

        it("should get total platform fees", async function () {
            const fees = await predictionMarket.getTotalPlatformFees()
            console.log("💰 Total platform fees:", ethers.formatEther(fees), "BNB")
        })

        it("should verify Pyth feed IDs", async function () {
            const btcFeedId = await predictionMarket.getFeedId("BTC")
            const ethFeedId = await predictionMarket.getFeedId("ETH")
            const bnbFeedId = await predictionMarket.getFeedId("BNB")

            console.log("🪙 BTC Feed ID:", btcFeedId)
            console.log("🪙 ETH Feed ID:", ethFeedId)
            console.log("🪙 BNB Feed ID:", bnbFeedId)

            expect(btcFeedId).to.not.equal(
                "0x0000000000000000000000000000000000000000000000000000000000000000",
            )
        })

        it("should get market details if markets exist", async function () {
            const count = await predictionMarket.getMarketCount()

            if (count > 0n) {
                const marketId = 0n
                const market = await predictionMarket.getMarket(marketId)

                console.log("\n📋 Market 0 Details:")
                console.log("   Description:", market.description)
                console.log("   Target Price:", ethers.formatEther(market.targetPrice), "USD")
                console.log(
                    "   Deadline:",
                    new Date(Number(market.deadline) * 1000).toLocaleString(),
                )
                console.log(
                    "   Total YES shares:",
                    market.totalYesShares ? ethers.formatEther(market.totalYesShares) : "0",
                )
                console.log(
                    "   Total NO shares:",
                    market.totalNoShares ? ethers.formatEther(market.totalNoShares) : "0",
                )
                console.log("   Resolved:", market.resolved || false)
                console.log(
                    "   Participants:",
                    market.participantCount ? market.participantCount.toString() : "0",
                )

                const balance = await predictionMarket.getMarketBalance(marketId)
                console.log("   Market balance:", ethers.formatEther(balance), "BNB")

                const platformFees = await predictionMarket.getPlatformFees(marketId)
                console.log("   Platform fees:", ethers.formatEther(platformFees), "BNB")
            } else {
                console.log("ℹ️  No markets created yet")
            }
        })
    })

    describe("LiquidityMarket - Read State", function () {
        it("should get market count", async function () {
            const count = await liquidityMarket.getMarketCount()
            console.log("\n📊 Total liquidity markets:", count.toString())
            expect(count).to.be.a("bigint")
        })

        it("should get pool tokens", async function () {
            const [token0, token1] = await liquidityMarket.getPoolTokens()
            console.log("🏊 Pool tokens:")
            console.log("   Token0:", token0)
            console.log("   Token1:", token1)
        })

        it("should get current pool liquidity", async function () {
            const liquidity = await liquidityMarket.getCurrentLiquidity()
            console.log("💧 Current pool liquidity:", liquidity.toString())
        })

        it("should get active markets", async function () {
            const activeMarkets = await liquidityMarket.getActiveMarkets()
            console.log("✅ Active liquidity markets:", activeMarkets.length)
        })

        it("should get total platform fees", async function () {
            const fees = await liquidityMarket.getTotalPlatformFees()
            console.log("💰 Total platform fees:", ethers.formatEther(fees), "BNB")
        })

        it("should get market details if markets exist", async function () {
            const count = await liquidityMarket.getMarketCount()

            if (count > 0n) {
                const marketId = 0n
                const market = await liquidityMarket.getMarket(marketId)

                console.log("\n📋 Liquidity Market 0 Details:")
                console.log("   Description:", market.description)
                console.log("   Target Liquidity:", market.targetLiquidity.toString())
                console.log(
                    "   Deadline:",
                    new Date(Number(market.deadline) * 1000).toLocaleString(),
                )
                console.log(
                    "   Total YES shares:",
                    market.totalYesShares ? ethers.formatEther(market.totalYesShares) : "0",
                )
                console.log(
                    "   Total NO shares:",
                    market.totalNoShares ? ethers.formatEther(market.totalNoShares) : "0",
                )
                console.log("   Resolved:", market.resolved || false)
                console.log(
                    "   Participants:",
                    market.participantCount ? market.participantCount.toString() : "0",
                )

                const balance = await liquidityMarket.getMarketBalance(marketId)
                console.log("   Market balance:", ethers.formatEther(balance), "BNB")
            } else {
                console.log("ℹ️  No liquidity markets created yet")
            }
        })
    })

    describe("Cost Calculations (Free)", function () {
        it("should calculate share costs if markets exist", async function () {
            const count = await predictionMarket.getMarketCount()

            if (count > 0n) {
                const marketId = 0n
                const shareAmount = ethers.parseEther("0.01") // 0.01 shares

                const yesCost = await predictionMarket.calculateYesCost(marketId, shareAmount)
                const noCost = await predictionMarket.calculateNoCost(marketId, shareAmount)

                console.log("\n💵 Cost to buy 0.01 shares in Market 0:")
                console.log("   YES shares:", ethers.formatEther(yesCost), "BNB")
                console.log("   NO shares:", ethers.formatEther(noCost), "BNB")

                // Calculate for different amounts
                const amounts = [
                    ethers.parseEther("0.001"),
                    ethers.parseEther("0.01"),
                    ethers.parseEther("0.1"),
                    ethers.parseEther("1"),
                ]

                console.log("\n📊 Cost table for different share amounts:")
                for (const amount of amounts) {
                    const cost = await predictionMarket.calculateYesCost(marketId, amount)
                    console.log(
                        `   ${ethers.formatEther(amount)} shares = ${ethers.formatEther(cost)} BNB`,
                    )
                }
            }
        })
    })
})
