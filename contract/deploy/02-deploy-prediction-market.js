const { network, ethers, run } = require("hardhat")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    log("----------------------------------------------------")
    log("🚀 Deploying PredictionMarket contract...")

    // Deploy PredictionMarket (no constructor parameters needed)
    const predictionMarket = await deploy("PredictionMarket", {
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: network.name === "hardhat" ? 1 : 6,
    })

    log(`✅ PredictionMarket deployed at: ${predictionMarket.address}`)

    // Verify on testnets
    if (network.name === "bnbTestnet" && process.env.BSCSCAN_API_KEY) {
        log("🔍 Verifying contract on BSCScan...")
        try {
            await run("verify:verify", {
                address: predictionMarket.address,
                constructorArguments: [],
            })
            log("✅ Contract verified!")
        } catch (error) {
            log(`❌ Verification failed: ${error.message}`)
        }
    }

    // Test deployment
    log("🧪 Testing deployment...")
    const PredictionMarket = await ethers.getContractFactory("PredictionMarket")
    const contract = PredictionMarket.attach(predictionMarket.address)

    const marketCount = await contract.getMarketCount()
    const btcFeedId = await contract.getFeedId("BTC")

    log(`📊 Market count: ${marketCount}`)
    log(`🪙 BTC Feed ID: ${btcFeedId}`)

    log("----------------------------------------------------")
    log("🎉 PredictionMarket deployment completed!")
    log(`📋 Contract: ${predictionMarket.address}`)
    log(`🌐 Network: ${network.name}`)
}

module.exports.tags = ["PredictionMarket", "all"]
