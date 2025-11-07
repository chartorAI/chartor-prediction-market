require("@nomicfoundation/hardhat-ethers")
require("@nomicfoundation/hardhat-chai-matchers")
require("hardhat-deploy")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("solidity-coverage")
require("@nomicfoundation/hardhat-verify")
require("dotenv").config()

const { networkConfig } = require("./helper-hardhat-config")

const PRIVATE_KEY = process.env.PRIVATE_KEY
const BNB_TESTNET_RPC_URL =
    process.env.BNB_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545/"
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ""

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
            allowUnlimitedContractSize: true,
        },
        localhost: {
            chainId: 31337,
            allowUnlimitedContractSize: true,
        },
        bnbTestnet: {
            url: BNB_TESTNET_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 97,
            blockConfirmations: 6,
        },
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
        customChains: [
            {
                network: "bscTestnet",
                chainId: 97,
                urls: {
                    apiURL: "https://api.etherscan.io/v2/api?chainid=97",
                    browserURL: "https://testnet.bscscan.com",
                },
            },
        ],
    },
    gasReporter: {
        enabled: process.env.REPORT_GAS !== undefined,
        currency: "USD",
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
    },
    solidity: {
        compilers: [
            {
                version: "0.8.20",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },
    mocha: {
        timeout: 500000,
    },
}
