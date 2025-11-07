import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base"
import { Web3Auth } from "@web3auth/modal"
import { bscTestnet } from "viem/chains"

export const web3AuthConfig = {
  clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || "",
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
  chainConfig: {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: "0x61", // BNB Testnet (97 in hex)
    rpcTarget:
      process.env.NEXT_PUBLIC_RPC_URL ||
      "https://data-seed-prebsc-1-s1.binance.org:8545/",
    displayName: "BNB Smart Chain Testnet",
    blockExplorerUrl: "https://testnet.bscscan.com",
    ticker: "tBNB",
    tickerName: "BNB",
  },
  uiConfig: {
    appName: "Prediction Market",
    theme: {
      primary: "#a855f7",
    },
    mode: "dark" as const,
    loginMethodsOrder: ["google", "twitter", "github"],
    defaultLanguage: "en",
  },
}

export const chainConfig = {
  chain: bscTestnet,
  rpcUrl:
    process.env.NEXT_PUBLIC_RPC_URL ||
    "https://data-seed-prebsc-1-s1.binance.org:8545/",
}

export const biconomyConfig = {
  bundlerUrl: process.env.NEXT_PUBLIC_BICONOMY_BUNDLER_URL || "",
  chainId: 97,
}

export const contractAddresses = {
  predictionMarket: process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS || "",
  liquidityMarket: process.env.NEXT_PUBLIC_LIQUIDITY_MARKET_ADDRESS || "",
}
