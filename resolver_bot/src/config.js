import dotenv from "dotenv";

dotenv.config();

export const config = {
  // Network
  rpcUrl:
    process.env.RPC_URL || "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
  chainId: parseInt(process.env.CHAIN_ID || "97"),

  // Contracts
  predictionMarketAddress: process.env.PREDICTION_MARKET_ADDRESS,
  liquidityMarketAddress: process.env.LIQUIDITY_MARKET_ADDRESS,

  // Bot
  privateKey: process.env.PRIVATE_KEY,
  checkInterval: parseInt(process.env.CHECK_INTERVAL || "60000"), // 1 minute
  gasLimit: parseInt(process.env.GAS_LIMIT || "500000"),

  // Logging
  logLevel: process.env.LOG_LEVEL || "info",
};

// Validate required config
export function validateConfig() {
  const required = [
    "privateKey",
    "predictionMarketAddress",
    "liquidityMarketAddress",
  ];
  const missing = required.filter((key) => !config[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required config: ${missing.join(", ")}`);
  }
}
