import { config, validateConfig } from "./config.js";
import { MarketResolver } from "./resolver.js";
import { logger } from "./logger.js";

async function main() {
  try {
    // Validate configuration
    validateConfig();

    logger.info("=".repeat(60));
    logger.info("🚀 Prediction Market Resolver Bot Starting...");
    logger.info("=".repeat(60));
    logger.info("Configuration:", {
      network: config.chainId === 97 ? "BNB Testnet" : "Unknown",
      checkInterval: `${config.checkInterval / 1000}s`,
      predictionMarket: config.predictionMarketAddress,
      liquidityMarket: config.liquidityMarketAddress,
    });
    logger.info("=".repeat(60));

    const resolver = new MarketResolver();

    // Initial check
    await resolver.resolveAll();

    // Set up interval
    logger.info(
      `\n⏰ Bot will check every ${config.checkInterval / 1000} seconds\n`
    );

    setInterval(async () => {
      try {
        await resolver.resolveAll();
      } catch (error) {
        logger.error("Error in interval check:", error.message);
      }
    }, config.checkInterval);

    // Keep process alive
    process.on("SIGINT", () => {
      logger.info("\n👋 Bot shutting down gracefully...");
      process.exit(0);
    });
  } catch (error) {
    logger.error("Fatal error:", error.message);
    process.exit(1);
  }
}

main();
