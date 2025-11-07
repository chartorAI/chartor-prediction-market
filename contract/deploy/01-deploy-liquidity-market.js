const { network, ethers, run } = require("hardhat")

const PANCAKE_V3_FACTORY = "0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865"
const WBNB_TESTNET = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd"
const USDT_TESTNET = "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd"

const FEE_TIERS = [3000, 500, 10000] // 0.3%, 0.05%, 1%

async function findBestPool(log) {
    log("🔍 Finding BNB/USDT PancakeSwap V3 pool...")

    const factoryABI = [
        "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)",
    ]

    const poolABI = ["function liquidity() external view returns (uint128)"]

    const factory = new ethers.Contract(PANCAKE_V3_FACTORY, factoryABI, ethers.provider)

    for (const fee of FEE_TIERS) {
        const poolAddress = await factory.getPool(WBNB_TESTNET, USDT_TESTNET, fee)

        if (poolAddress !== ethers.ZeroAddress) {
            log(`✅ Found pool at ${poolAddress} (fee: ${fee / 10000}%)`)

            // Verify pool has liquidity
            const pool = new ethers.Contract(poolAddress, poolABI, ethers.provider)
            const liquidity = await pool.liquidity()

            if (liquidity > 0) {
                log(`💧 Pool has liquidity: ${liquidity.toString()}`)
                return poolAddress
            }
        }
    }

    throw new Error("No BNB/USDT pools found with liquidity on BSC testnet")
}

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    log("----------------------------------------------------")
    log("🚀 Deploying LiquidityMarket contract...")

    let poolAddress

    if (network.name === "hardhat" || network.name === "localhost") {
        // For local testing, deploy a mock pool
        log("🧪 Deploying MockPancakeV3Pool for local testing...")

        const mockPool = await deploy("MockPancakeV3Pool", {
            from: deployer,
            args: [],
            log: true,
            waitConfirmations: 1,
        })

        poolAddress = mockPool.address
        log(`✅ MockPancakeV3Pool deployed at: ${poolAddress}`)
    } else if (network.name === "bnbTestnet") {
        // For BSC testnet, automatically find the pool
        poolAddress = await findBestPool(log)
        log(`🎯 Using pool address: ${poolAddress}`)
    } else {
        throw new Error(`❌ Unsupported network: ${network.name}`)
    }

    // Deploy LiquidityMarket
    log(`🚀 Deploying LiquidityMarket with pool: ${poolAddress}`)

    const liquidityMarket = await deploy("LiquidityMarket", {
        from: deployer,
        args: [poolAddress],
        log: true,
        waitConfirmations: network.name === "hardhat" ? 1 : 6,
    })

    log(`✅ LiquidityMarket deployed at: ${liquidityMarket.address}`)

    // Verify on BSC testnet
    if (network.name === "bnbTestnet" && process.env.ETHERSCAN_API_KEY) {
        log("🔍 Verifying contract on BSCScan...")
        try {
            await run("verify:verify", {
                address: liquidityMarket.address,
                constructorArguments: [poolAddress],
            })
            log("✅ Contract verified!")
        } catch (error) {
            log(`❌ Verification failed: ${error.message}`)
        }
    }

    // Test deployment
    log("🧪 Testing deployment...")
    const LiquidityMarket = await ethers.getContractFactory("LiquidityMarket")
    const contract = LiquidityMarket.attach(liquidityMarket.address)

    const marketCount = await contract.getMarketCount()
    const [token0, token1] = await contract.getPoolTokens()

    log(`📊 Market count: ${marketCount}`)
    log(`🪙 Pool tokens: ${token0} / ${token1}`)

    log("----------------------------------------------------")
    log("🎉 Deployment completed!")
    log(`📋 Contract: ${liquidityMarket.address}`)
    log(`🏊 Pool: ${poolAddress}`)
}

module.exports.tags = ["LiquidityMarket", "all"]
