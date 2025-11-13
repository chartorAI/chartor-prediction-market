import { ethers } from "ethers";
import { config } from "./config.js";
import {
  PREDICTION_MARKET_ABI,
  LIQUIDITY_MARKET_ABI,
  PYTH_ABI,
} from "./abis.js";
import { logger } from "./logger.js";

const PYTH_ORACLE_ADDRESS = "0x5744Cbf430D99456a0A8771208b674F27f8EF0Fb";
const PYTH_HERMES_API = "https://hermes.pyth.network";

export class MarketResolver {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);

    this.predictionMarket = new ethers.Contract(
      config.predictionMarketAddress,
      PREDICTION_MARKET_ABI,
      this.wallet
    );

    this.liquidityMarket = new ethers.Contract(
      config.liquidityMarketAddress,
      LIQUIDITY_MARKET_ABI,
      this.wallet
    );

    this.pythOracle = new ethers.Contract(
      PYTH_ORACLE_ADDRESS,
      PYTH_ABI,
      this.wallet
    );

    logger.info("Resolver initialized", {
      address: this.wallet.address,
      network: config.chainId,
    });
  }

  async fetchPythPriceUpdate(feedId) {
    try {
      const feedIdHex = feedId.startsWith("0x") ? feedId.slice(2) : feedId;
      const url = `${PYTH_HERMES_API}/v2/updates/price/latest?ids[]=${feedIdHex}`;

      logger.debug(`Fetching price update from Pyth: ${url}`);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Pyth API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.binary || !data.binary.data || data.binary.data.length === 0) {
        throw new Error("No price update data received from Pyth");
      }

      return data.binary.data[0];
    } catch (error) {
      logger.error(`Failed to fetch Pyth price update: ${error.message}`);
      throw error;
    }
  }

  async updatePythPrice(feedId) {
    try {
      const priceUpdateData = await this.fetchPythPriceUpdate(feedId);
      const updateData = [`0x${priceUpdateData}`];

      const updateFee = await this.pythOracle.getUpdateFee(updateData);
      logger.debug(`Pyth update fee: ${ethers.formatEther(updateFee)} BNB`);

      const tx = await this.pythOracle.updatePriceFeeds(updateData, {
        value: updateFee,
        gasLimit: 200000,
      });

      logger.debug(`Pyth price update tx: ${tx.hash}`);
      await tx.wait();
      logger.debug(`Pyth price updated successfully`);

      return true;
    } catch (error) {
      logger.error(`Failed to update Pyth price: ${error.message}`);
      return false;
    }
  }

  async getBalance() {
    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }

  async resolvePriceMarkets() {
    try {
      const expiredMarkets =
        await this.predictionMarket.getExpiredUnresolvedMarkets();

      if (expiredMarkets.length === 0) {
        logger.debug("No expired price markets to resolve");
        return { resolved: 0, failed: 0 };
      }

      logger.info(`Found ${expiredMarkets.length} expired price market(s)`);

      let resolved = 0;
      let failed = 0;

      for (const marketId of expiredMarkets) {
        try {
          const market = await this.predictionMarket.getMarket(marketId);
          logger.info(
            `Resolving price market #${marketId}: ${market.description}`
          );

          // Update Pyth price feed before resolving
          logger.debug(`Updating Pyth price for feed: ${market.pythFeedId}`);
          const priceUpdated = await this.updatePythPrice(market.pythFeedId);

          if (!priceUpdated) {
            logger.warn(
              `Failed to update Pyth price for market #${marketId}, attempting resolution anyway...`
            );
          }

          const tx = await this.predictionMarket.resolveMarket(marketId, {
            gasLimit: config.gasLimit,
          });

          logger.info(`Transaction sent: ${tx.hash}`);
          const receipt = await tx.wait();

          if (receipt.status === 1) {
            logger.info(`✓ Market #${marketId} resolved successfully`);
            resolved++;
          } else {
            logger.error(`✗ Market #${marketId} resolution failed`);
            failed++;
          }
        } catch (error) {
          logger.error(
            `Error resolving price market #${marketId}:`,
            error.message
          );
          failed++;
        }
      }

      return { resolved, failed };
    } catch (error) {
      logger.error("Error in resolvePriceMarkets:", error.message);
      return { resolved: 0, failed: 0 };
    }
  }

  async resolveLiquidityMarkets() {
    try {
      const expiredMarkets =
        await this.liquidityMarket.getExpiredUnresolvedMarkets();

      if (expiredMarkets.length === 0) {
        logger.debug("No expired liquidity markets to resolve");
        return { resolved: 0, failed: 0 };
      }

      logger.info(`Found ${expiredMarkets.length} expired liquidity market(s)`);

      let resolved = 0;
      let failed = 0;

      for (const marketId of expiredMarkets) {
        try {
          const market = await this.liquidityMarket.getMarket(marketId);
          logger.info(
            `Resolving liquidity market #${marketId}: ${market.description}`
          );

          const tx = await this.liquidityMarket.resolveMarket(marketId, {
            gasLimit: config.gasLimit,
          });

          logger.info(`Transaction sent: ${tx.hash}`);
          const receipt = await tx.wait();

          if (receipt.status === 1) {
            logger.info(`✓ Market #${marketId} resolved successfully`);
            resolved++;
          } else {
            logger.error(`✗ Market #${marketId} resolution failed`);
            failed++;
          }
        } catch (error) {
          logger.error(
            `Error resolving liquidity market #${marketId}:`,
            error.message
          );
          failed++;
        }
      }

      return { resolved, failed };
    } catch (error) {
      logger.error("Error in resolveLiquidityMarkets:", error.message);
      return { resolved: 0, failed: 0 };
    }
  }

  async resolveAll() {
    logger.info("🤖 Starting resolution check...");

    const balance = await this.getBalance();
    logger.info(`Wallet balance: ${balance} BNB`);

    if (parseFloat(balance) < 0.01) {
      logger.warn(
        "⚠️  Low balance! Please add more BNB to continue resolving markets"
      );
    }

    const priceResults = await this.resolvePriceMarkets();
    const liquidityResults = await this.resolveLiquidityMarkets();

    const totalResolved = priceResults.resolved + liquidityResults.resolved;
    const totalFailed = priceResults.failed + liquidityResults.failed;

    if (totalResolved > 0 || totalFailed > 0) {
      logger.info("Resolution summary:", {
        resolved: totalResolved,
        failed: totalFailed,
        priceMarkets: priceResults,
        liquidityMarkets: liquidityResults,
      });
    } else {
      logger.info("✓ All markets up to date");
    }

    return { totalResolved, totalFailed };
  }
}
