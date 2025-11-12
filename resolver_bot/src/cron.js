import { config, validateConfig } from "./config.js";
import { MarketResolver } from "./resolver.js";
import { logger } from "./logger.js";

async function main() {
  try {
    validateConfig();

    logger.info("🤖 Cron job started - checking for expired markets...");

    const resolver = new MarketResolver();
    await resolver.resolveAll();

    logger.info("✓ Cron job completed successfully");
    process.exit(0);
  } catch (error) {
    logger.error("Fatal error:", error.message);
    process.exit(1);
  }
}

main();
