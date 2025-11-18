const { ethers } = require("hardhat")

async function main() {
    console.log("\n🐋 Checking Whale Tracking on BNB Testnet\n")

    const predictionMarket = await ethers.getContractAt(
        "PredictionMarket",
        "0x145f0B7c4777D05C5326DE723c9087E1cd0C8C68",
    )

    // Get market count
    const marketCount = await predictionMarket.marketCounter()
    console.log(`Total markets: ${marketCount}\n`)

    // Check each market
    for (let i = 0; i < marketCount; i++) {
        console.log(`\n📊 Market ${i}`)
        console.log("─────────────────────────────")

        try {
            // Get market config
            const market = await predictionMarket.markets(i)
            console.log(`Description: ${market.description}`)
            console.log(`Resolved: ${market.exists}`)

            // Get share quantities
            const qYes = await predictionMarket.qYes(i)
            const qNo = await predictionMarket.qNo(i)
            console.log(`\nShares:`)
            console.log(`  qYes: ${ethers.formatEther(qYes)} (${qYes.toString()} wei)`)
            console.log(`  qNo:  ${ethers.formatEther(qNo)} (${qNo.toString()} wei)`)

            // Get whale data
            const whales = await predictionMarket.getCurrentWhales(i)
            console.log(`\nWhale Tracking:`)

            if (whales[0].whale !== ethers.ZeroAddress) {
                console.log(`  YES Whale:`)
                console.log(`    Address: ${whales[0].whale}`)
                console.log(`    Amount:  ${ethers.formatEther(whales[0].amount)} BNB`)
                console.log(`    Amount (wei): ${whales[0].amount.toString()}`)
                console.log(
                    `    Timestamp: ${new Date(Number(whales[0].timestamp) * 1000).toISOString()}`,
                )
            } else {
                console.log(`  YES Whale: None`)
            }

            if (whales[1].whale !== ethers.ZeroAddress) {
                console.log(`  NO Whale:`)
                console.log(`    Address: ${whales[1].whale}`)
                console.log(`    Amount:  ${ethers.formatEther(whales[1].amount)} BNB`)
                console.log(`    Amount (wei): ${whales[1].amount.toString()}`)
                console.log(
                    `    Timestamp: ${new Date(Number(whales[1].timestamp) * 1000).toISOString()}`,
                )
            } else {
                console.log(`  NO Whale: None`)
            }

            // Get market balance
            const balance = await predictionMarket.getMarketBalance(i)
            console.log(`\nMarket Balance: ${ethers.formatEther(balance)} BNB`)
        } catch (error) {
            console.log(`❌ Error reading market ${i}: ${error.message}`)
        }
    }

    console.log("\n✅ Whale tracking check complete\n")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
