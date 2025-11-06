const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("PredictionMarketHub", function () {
  let hub;
  let owner, trader1, trader2, trader3;

  // Test constants
  const LIQUIDITY_PARAM = ethers.parseEther("10"); // 10 ETH
  const BTC_TARGET_PRICE = ethers.parseEther("50000"); // $50,000
  const GOLD_TARGET_PRICE = ethers.parseEther("2100"); // $2,100
  const BTC_DESCRIPTION = "BTC will reach $50,000 by deadline";
  const GOLD_DESCRIPTION = "GOLD will reach $2,100 by deadline";
  const BTC_FEED_ID =
    "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43";
  const GOLD_FEED_ID =
    "0x765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2";

  beforeEach(async function () {
    [owner, trader1, trader2, trader3] = await ethers.getSigners();

    // Deploy the hub contract
    const PredictionMarketHub = await ethers.getContractFactory(
      "PredictionMarketHub"
    );
    hub = await PredictionMarketHub.deploy();
    await hub.waitForDeployment();
  });

  describe("Hub Initialization", function () {
    it("should initialize with zero markets", async function () {
      expect(await hub.getMarketCount()).to.equal(0n);
    });

    it("should have correct Pyth feed IDs configured", async function () {
      const btcFeedId = await hub.getFeedId("BTC");
      const goldFeedId = await hub.getFeedId("GOLD");

      expect(btcFeedId).to.equal(BTC_FEED_ID);
      expect(goldFeedId).to.equal(GOLD_FEED_ID);
    });

    it("should return empty arrays for market listings initially", async function () {
      const activeMarkets = await hub.getActiveMarkets();
      const resolvedMarkets = await hub.getResolvedMarkets();

      expect(activeMarkets.length).to.equal(0);
      expect(resolvedMarkets.length).to.equal(0);
    });
  });

  describe("Market Creation", function () {
    it("should create a BTC market successfully", async function () {
      const currentTime = await time.latest();
      const deadline = currentTime + 24 * 60 * 60; // 24 hours

      const tx = await hub.createMarket(
        BTC_FEED_ID,
        BTC_TARGET_PRICE,
        deadline,
        LIQUIDITY_PARAM,
        BTC_DESCRIPTION
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (log) => log.fragment?.name === "MarketCreated"
      );

      expect(event.args.marketId).to.equal(0n);
      expect(event.args.pythFeedId).to.equal(BTC_FEED_ID);
      expect(event.args.targetPrice).to.equal(BTC_TARGET_PRICE);
      expect(event.args.creator).to.equal(owner.address);

      // Check market count increased
      expect(await hub.getMarketCount()).to.equal(1n);
    });

    it("should create multiple markets with different assets", async function () {
      const currentTime = await time.latest();
      const deadline1 = currentTime + 24 * 60 * 60;
      const deadline2 = currentTime + 48 * 60 * 60;

      // Create BTC market
      await hub.createMarket(
        BTC_FEED_ID,
        BTC_TARGET_PRICE,
        deadline1,
        LIQUIDITY_PARAM,
        BTC_DESCRIPTION
      );

      // Create GOLD market
      await hub.createMarket(
        GOLD_FEED_ID,
        GOLD_TARGET_PRICE,
        deadline2,
        LIQUIDITY_PARAM,
        GOLD_DESCRIPTION
      );

      expect(await hub.getMarketCount()).to.equal(2n);

      // Check market details
      const btcMarket = await hub.getMarket(0);
      const goldMarket = await hub.getMarket(1);

      expect(btcMarket.pythFeedId).to.equal(BTC_FEED_ID);
      expect(btcMarket.targetPrice).to.equal(BTC_TARGET_PRICE);
      expect(goldMarket.pythFeedId).to.equal(GOLD_FEED_ID);
      expect(goldMarket.targetPrice).to.equal(GOLD_TARGET_PRICE);
    });

    it("should revert with invalid deadline", async function () {
      const currentTime = await time.latest();
      const invalidDeadline = currentTime + 30 * 60; // 30 minutes (too soon)

      await expect(
        hub.createMarket(
          BTC_FEED_ID,
          BTC_TARGET_PRICE,
          invalidDeadline,
          LIQUIDITY_PARAM,
          BTC_DESCRIPTION
        )
      ).to.be.revertedWithCustomError(hub, "InvalidDeadline");
    });

    it("should revert with invalid feed ID", async function () {
      const currentTime = await time.latest();
      const deadline = currentTime + 24 * 60 * 60;
      const invalidFeedId =
        "0x0000000000000000000000000000000000000000000000000000000000000000";

      await expect(
        hub.createMarket(
          invalidFeedId,
          BTC_TARGET_PRICE,
          deadline,
          LIQUIDITY_PARAM,
          BTC_DESCRIPTION
        )
      ).to.be.revertedWithCustomError(hub, "InvalidFeedId");
    });
  });

  describe("Trading in Multiple Markets", function () {
    let btcMarketId, goldMarketId;

    beforeEach(async function () {
      const currentTime = await time.latest();
      const deadline = currentTime + 24 * 60 * 60;

      // Create BTC market
      const tx1 = await hub.createMarket(
        BTC_FEED_ID,
        BTC_TARGET_PRICE,
        deadline,
        LIQUIDITY_PARAM,
        BTC_DESCRIPTION
      );
      const receipt1 = await tx1.wait();
      btcMarketId = receipt1.logs.find(
        (log) => log.fragment?.name === "MarketCreated"
      ).args.marketId;

      // Create GOLD market
      const tx2 = await hub.createMarket(
        GOLD_FEED_ID,
        GOLD_TARGET_PRICE,
        deadline,
        LIQUIDITY_PARAM,
        GOLD_DESCRIPTION
      );
      const receipt2 = await tx2.wait();
      goldMarketId = receipt2.logs.find(
        (log) => log.fragment?.name === "MarketCreated"
      ).args.marketId;
    });

    it("should allow trading in BTC market", async function () {
      const shareAmount = ethers.parseEther("1");
      const cost = await hub.calculateYesCost(btcMarketId, shareAmount);

      await hub
        .connect(trader1)
        .buyYesShares(btcMarketId, shareAmount, { value: cost });

      const position = await hub.getPosition(btcMarketId, trader1.address);
      expect(position.yesShares).to.equal(shareAmount);

      // Check participant count
      expect(await hub.getParticipantCount(btcMarketId)).to.equal(1n);
      expect(await hub.getParticipant(btcMarketId, 0)).to.equal(
        trader1.address
      );
    });

    it("should allow trading in GOLD market independently", async function () {
      const shareAmount = ethers.parseEther("1");
      const cost = await hub.calculateYesCost(goldMarketId, shareAmount);

      await hub
        .connect(trader2)
        .buyYesShares(goldMarketId, shareAmount, { value: cost });

      const position = await hub.getPosition(goldMarketId, trader2.address);
      expect(position.yesShares).to.equal(shareAmount);

      // Check that BTC market is unaffected
      expect(await hub.getParticipantCount(btcMarketId)).to.equal(0n);
      expect(await hub.getParticipantCount(goldMarketId)).to.equal(1n);
    });

    it("should track whale bets separately per market", async function () {
      const smallBet = ethers.parseEther("0.5");
      const largeBet = ethers.parseEther("2");

      // Small bet in BTC market
      const btcCost1 = await hub.calculateYesCost(btcMarketId, smallBet);
      await hub
        .connect(trader1)
        .buyYesShares(btcMarketId, smallBet, { value: btcCost1 });

      // Large bet in GOLD market
      const goldCost1 = await hub.calculateYesCost(goldMarketId, largeBet);
      await hub
        .connect(trader2)
        .buyYesShares(goldMarketId, largeBet, { value: goldCost1 });

      // Check whales are tracked separately
      const btcWhales = await hub.getCurrentWhales(btcMarketId);
      const goldWhales = await hub.getCurrentWhales(goldMarketId);

      expect(btcWhales.largestYes.whale).to.equal(trader1.address);
      expect(goldWhales.largestYes.whale).to.equal(trader2.address);
    });

    it("should calculate prices independently per market", async function () {
      const shareAmount = ethers.parseEther("1");

      // Buy YES shares in BTC market only
      const btcCost = await hub.calculateYesCost(btcMarketId, shareAmount);
      await hub
        .connect(trader1)
        .buyYesShares(btcMarketId, shareAmount, { value: btcCost });

      // BTC market should have skewed prices
      const btcYesPrice = await hub.getPriceYes(btcMarketId);
      const btcNoPrice = await hub.getPriceNo(btcMarketId);

      // GOLD market should still have balanced prices (no trades)
      const goldYesPrice = await hub.getPriceYes(goldMarketId);
      const goldNoPrice = await hub.getPriceNo(goldMarketId);

      expect(btcYesPrice).to.be.greaterThan(goldYesPrice);
      expect(btcNoPrice).to.be.lessThan(goldNoPrice);
    });
  });

  describe("Market Listing and Filtering", function () {
    let btcMarketId, goldMarketId, expiredMarketId;

    beforeEach(async function () {
      const currentTime = await time.latest();
      const futureDeadline = currentTime + 24 * 60 * 60;
      const pastDeadline = currentTime - 60 * 60; // 1 hour ago

      // Create active BTC market
      const tx1 = await hub.createMarket(
        BTC_FEED_ID,
        BTC_TARGET_PRICE,
        futureDeadline,
        LIQUIDITY_PARAM,
        BTC_DESCRIPTION
      );
      const receipt1 = await tx1.wait();
      btcMarketId = receipt1.logs.find(
        (log) => log.fragment?.name === "MarketCreated"
      ).args.marketId;

      // Create active GOLD market
      const tx2 = await hub.createMarket(
        GOLD_FEED_ID,
        GOLD_TARGET_PRICE,
        futureDeadline,
        LIQUIDITY_PARAM,
        GOLD_DESCRIPTION
      );
      const receipt2 = await tx2.wait();
      goldMarketId = receipt2.logs.find(
        (log) => log.fragment?.name === "MarketCreated"
      ).args.marketId;
    });

    it("should list active markets correctly", async function () {
      const activeMarkets = await hub.getActiveMarkets();

      expect(activeMarkets.length).to.equal(2);
      expect(activeMarkets).to.include(btcMarketId);
      expect(activeMarkets).to.include(goldMarketId);
    });

    it("should filter markets by asset", async function () {
      const btcMarkets = await hub.getMarketsByAsset(BTC_FEED_ID);
      const goldMarkets = await hub.getMarketsByAsset(GOLD_FEED_ID);

      expect(btcMarkets.length).to.equal(1);
      expect(btcMarkets[0]).to.equal(btcMarketId);

      expect(goldMarkets.length).to.equal(1);
      expect(goldMarkets[0]).to.equal(goldMarketId);
    });

    it("should return empty resolved markets initially", async function () {
      const resolvedMarkets = await hub.getResolvedMarkets();
      expect(resolvedMarkets.length).to.equal(0);
    });
  });

  describe("Market Resolution", function () {
    let marketId;

    beforeEach(async function () {
      const currentTime = await time.latest();
      const deadline = currentTime + 24 * 60 * 60;

      // Create market
      const tx = await hub.createMarket(
        BTC_FEED_ID,
        BTC_TARGET_PRICE,
        deadline,
        LIQUIDITY_PARAM,
        BTC_DESCRIPTION
      );
      const receipt = await tx.wait();
      marketId = receipt.logs.find(
        (log) => log.fragment?.name === "MarketCreated"
      ).args.marketId;

      // Add some trading positions
      const shareAmount = ethers.parseEther("1");

      const yesCost = await hub.calculateYesCost(marketId, shareAmount);
      await hub
        .connect(trader1)
        .buyYesShares(marketId, shareAmount, { value: yesCost });

      const noCost = await hub.calculateNoCost(marketId, shareAmount);
      await hub
        .connect(trader2)
        .buyNoShares(marketId, shareAmount, { value: noCost });
    });

    it("should revert resolution before deadline", async function () {
      await expect(hub.resolveMarket(marketId)).to.be.revertedWithCustomError(
        hub,
        "DeadlineNotReached"
      );
    });

    it("should return correct resolution status", async function () {
      let [isResolved, outcome] = await hub.getResolutionStatus(marketId);
      expect(isResolved).to.be.false;
      expect(outcome).to.be.false; // Default value when not resolved
    });

    it("should calculate trader payouts correctly", async function () {
      // Before resolution, payouts should be 0
      expect(await hub.getTraderPayout(marketId, trader1.address)).to.equal(0n);
      expect(await hub.getTraderPayout(marketId, trader2.address)).to.equal(0n);
      expect(await hub.getTotalPayout(marketId)).to.equal(0n);
    });
  });

  describe("Error Handling", function () {
    it("should revert when accessing non-existent market", async function () {
      await expect(hub.getMarket(999)).to.be.revertedWithCustomError(
        hub,
        "MarketNotFound"
      );
    });

    it("should revert when trading in non-existent market", async function () {
      const shareAmount = ethers.parseEther("1");

      await expect(
        hub.buyYesShares(999, shareAmount, { value: ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(hub, "MarketNotFound");
    });

    it("should handle invalid feed ID lookup", async function () {
      await expect(hub.getFeedId("INVALID")).to.be.revertedWithCustomError(
        hub,
        "InvalidFeedId"
      );
    });
  });

  describe("Gas Efficiency", function () {
    it("should be more gas efficient than multiple deployments", async function () {
      const currentTime = await time.latest();
      const deadline = currentTime + 24 * 60 * 60;

      // Creating a market should cost much less than deploying a new contract
      const tx = await hub.createMarket(
        BTC_FEED_ID,
        BTC_TARGET_PRICE,
        deadline,
        LIQUIDITY_PARAM,
        BTC_DESCRIPTION
      );

      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed;

      // Market creation should use less than 500k gas (vs 2-3M for contract deployment)
      expect(gasUsed).to.be.lessThan(500000n);

      console.log(`Market creation gas used: ${gasUsed}`);
    });

    it("should handle multiple markets efficiently", async function () {
      const currentTime = await time.latest();
      const deadline = currentTime + 24 * 60 * 60;

      // Create 5 markets and measure total gas
      let totalGas = 0n;

      for (let i = 0; i < 5; i++) {
        const tx = await hub.createMarket(
          BTC_FEED_ID,
          BTC_TARGET_PRICE + BigInt(i * 1000) * BigInt(1e18), // Different target prices
          deadline,
          LIQUIDITY_PARAM,
          `BTC Market ${i}`
        );

        const receipt = await tx.wait();
        totalGas += receipt.gasUsed;
      }

      console.log(`Total gas for 5 markets: ${totalGas}`);
      console.log(`Average gas per market: ${totalGas / 5n}`);

      // Should be much less than 5 contract deployments (5 * 2.5M = 12.5M gas)
      expect(totalGas).to.be.lessThan(2500000n); // Less than one contract deployment
    });
  });
});
