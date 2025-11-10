const { expect } = require("chai")
const { ethers } = require("hardhat")

/**
 * Expired Markets Test
 *
 * Run with: npx hardhat test test/ExpiredMarkets.testnet.js --network bnbTestnet
 *
 * Requirements: NO tBNB needed - all read operations are free!
 */
describe("Expired Markets Test", function () {
    let predictionMarket
    let owner

    const PREDICTION_MARKET_ADDRESS = "0xAAA0A8Ff9644a8A369f6287b8E2aB2d4446952Bf"

    before(async function () {
        ;[owner] = await ethers.getSigners()

        // Connect to deployed contract
        const PredictionMarket = await ethers.getContractFactory("PredictionMarket")
        predictionMarket = PredictionMarket.attach(PREDICTION_MARKET_ADDRESS)

        console.log("\n=== Connected to Testnet Contract ===")
        console.log("PredictionMarket:", PREDICTION_MARKET_ADDRESS)
        console.log("Your address:", owner.address)
        console.log("=====================================\n")
    })

    describe("getExpiredUnresolvedMarkets()", function () {
        it("should get all expired unresolved markets", async function () {
            const expiredMarkets = await predictionMarket.getExpiredUnresolvedMarkets()

            console.log("⏰ Expired Unresolved Markets:", expiredMarkets.length)

            if (expiredMarkets.length > 0) {
                console.log("   Market IDs:", expiredMarkets.map((id) => id.toString()).join(", "))
            } else {
                console.log("   ✅ No expired markets waiting for resolution")
            }

            expect(expiredMarkets).to.be.an("array")
        })

        it("should show details of expired markets", async function () {
            const expiredMarkets = await predictionMarket.getExpiredUnresolvedMarkets()

            if (expiredMarkets.length > 0) {
                console.log("\n📋 Expired Market Details:\n")

                for (const marketId of expiredMarkets) {
                    const market = await predictionMarket.getMarket(marketId)
                    const [isResolved] = await predictionMarket.getResolutionStatus(marketId)
                    const balance = await predictionMarket.getMarketBalance(marketId)

                    const now = Math.floor(Date.now() / 1000)
                    const timeExpired = now - Number(market.deadline)
                    const hoursExpired = Math.floor(timeExpired / 3600)
                    const minutesExpired = Math.floor((timeExpired % 3600) / 60)

                    console.log(`Market #${marketId}:`)
                    console.log(`   Description: ${market.description}`)
                    console.log(
                        `   Deadline: ${new Date(Number(market.deadline) * 1000).toLocaleString()}`,
                    )
                    console.log(`   Expired: ${hoursExpired}h ${minutesExpired}m ago`)
                    console.log(`   Resolved: ${isResolved}`)
                    console.log(`   Balance: ${ethers.formatEther(balance)} BNB`)
                    console.log(`   Target Price: ${ethers.formatEther(market.targetPrice)} USD`)
                    console.log("")
                }
            } else {
                console.log("\nℹ️  No expired markets to show details for")
            }
        })

        it("should compare with active and resolved markets", async function () {
            const activeMarkets = await predictionMarket.getActiveMarkets()
            const resolvedMarkets = await predictionMarket.getResolvedMarkets()
            const expiredMarkets = await predictionMarket.getExpiredUnresolvedMarkets()
            const totalMarkets = await predictionMarket.getMarketCount()

            console.log("\n📊 Market Status Summary:")
            console.log(`   Total Markets: ${totalMarkets}`)
            console.log(`   Active (not expired): ${activeMarkets.length}`)
            console.log(`   Expired (waiting resolution): ${expiredMarkets.length}`)
            console.log(`   Resolved: ${resolvedMarkets.length}`)

            // Verify the math adds up
            const sum =
                BigInt(activeMarkets.length) +
                BigInt(expiredMarkets.length) +
                BigInt(resolvedMarkets.length)
            console.log(`   Sum check: ${sum} = ${totalMarkets} ✓`)

            expect(sum).to.equal(totalMarkets)
        })

        it("should verify expired markets are not in active list", async function () {
            const activeMarkets = await predictionMarket.getActiveMarkets()
            const expiredMarkets = await predictionMarket.getExpiredUnresolvedMarkets()

            // Convert to strings for easier comparison
            const activeIds = activeMarkets.map((id) => id.toString())
            const expiredIds = expiredMarkets.map((id) => id.toString())

            // Check no overlap
            const overlap = activeIds.filter((id) => expiredIds.includes(id))

            console.log("\n🔍 Validation:")
            console.log(`   Active markets: ${activeIds.join(", ") || "none"}`)
            console.log(`   Expired markets: ${expiredIds.join(", ") || "none"}`)
            console.log(`   Overlap: ${overlap.length === 0 ? "none ✓" : overlap.join(", ")}`)

            expect(overlap).to.have.lengthOf(0)
        })

        it("should verify expired markets are not resolved", async function () {
            const expiredMarkets = await predictionMarket.getExpiredUnresolvedMarkets()

            if (expiredMarkets.length > 0) {
                console.log("\n✅ Verifying expired markets are unresolved:")

                for (const marketId of expiredMarkets) {
                    const [isResolved] = await predictionMarket.getResolutionStatus(marketId)
                    console.log(`   Market #${marketId}: resolved = ${isResolved}`)
                    expect(isResolved).to.be.false
                }
            } else {
                console.log("\nℹ️  No expired markets to verify")
            }
        })

        it("should show current time vs deadlines", async function () {
            const expiredMarkets = await predictionMarket.getExpiredUnresolvedMarkets()
            const now = Math.floor(Date.now() / 1000)

            console.log("\n⏰ Time Check:")
            console.log(`   Current time: ${new Date(now * 1000).toLocaleString()}`)

            if (expiredMarkets.length > 0) {
                console.log("\n   Expired markets deadlines:")
                for (const marketId of expiredMarkets) {
                    const market = await predictionMarket.getMarket(marketId)
                    const deadline = Number(market.deadline)
                    const isPast = now >= deadline

                    console.log(
                        `   Market #${marketId}: ${new Date(deadline * 1000).toLocaleString()} ${isPast ? "✓ (past)" : "✗ (future)"}`,
                    )
                    expect(isPast).to.be.true
                }
            } else {
                console.log("   No expired markets")
            }
        })
    })

    describe("Bot Simulation", function () {
        it("should simulate bot checking for expired markets", async function () {
            console.log("\n🤖 Bot Simulation:")
            console.log("   Checking for expired markets...")

            const expiredMarkets = await predictionMarket.getExpiredUnresolvedMarkets()

            console.log(`   Found ${expiredMarkets.length} market(s) to resolve`)

            if (expiredMarkets.length > 0) {
                console.log("\n   Bot would resolve these markets:")
                for (const marketId of expiredMarkets) {
                    const market = await predictionMarket.getMarket(marketId)
                    console.log(`   - Market #${marketId}: ${market.description}`)
                }

                console.log("\n   ⚠️  Note: Actual resolution requires calling resolveMarket()")
                console.log("   which needs gas and will fetch Pyth price data")
            } else {
                console.log("   ✅ No action needed - all markets are up to date")
            }
        })
    })
})
