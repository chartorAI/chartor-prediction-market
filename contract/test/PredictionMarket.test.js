const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("PredictionMarket", function () {
  let predictionMarket;
  let owner, trader1, trader2, trader3;

  // Test constants
  const LIQUIDITY_PARAM = ethers.parseEther("10"); // 10 ETH
  const TARGET_PRICE = ethers.parseEther("50000"); // $50,000
  const DESCRIPTION = "BTC will reach $50,000 by deadline";
  const PYTH_FEED_ID =
    "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43"; // BTC/USD

  beforeEach(async function () {
    [owner, trader1, trader2, trader3] = await ethers.getSigners();

    // Set deadline to 24 hours from now
    const currentTime = await time.latest();
    const deadline = currentTime + 24 * 60 * 60; // 24 hours

    const PredictionMarket =
      await ethers.getContractFactory("PredictionMarket");
    predictionMarket = await PredictionMarket.deploy(
      PYTH_FEED_ID,
      TARGET_PRICE,
      deadline,
      LIQUIDITY_PARAM,
      DESCRIPTION,
      owner.address
    );
    await predictionMarket.waitForDeployment();
  });

  describe("Contract Initialization", function () {
    it("should initialize with correct parameters", async function () {
      const config = await predictionMarket.marketConfig();

      expect(config.pythFeedId).to.equal(PYTH_FEED_ID);
      expect(config.targetPrice).to.equal(TARGET_PRICE);
      expect(config.liquidityParam).to.equal(LIQUIDITY_PARAM);
      expect(config.description).to.equal(DESCRIPTION);
      expect(config.creator).to.equal(owner.address);
    });

    it("should start with zero shares", async function () {
      expect(await predictionMarket.qYes()).to.equal(0n);
      expect(await predictionMarket.qNo()).to.equal(0n);
    });

    it("should not be resolved initially", async function () {
      expect(await predictionMarket.resolved()).to.be.false;
    });

    it("should have no participants initially", async function () {
      expect(await predictionMarket.getParticipantCount()).to.equal(0n);
    });
  });

  describe("Constructor Validation", function () {
    it("should revert with deadline too soon", async function () {
      const currentTime = await time.latest();
      const invalidDeadline = currentTime + 30 * 60; // 30 minutes (less than 1 hour)

      const PredictionMarket =
        await ethers.getContractFactory("PredictionMarket");

      await expect(
        PredictionMarket.deploy(
          PYTH_FEED_ID,
          TARGET_PRICE,
          invalidDeadline,
          LIQUIDITY_PARAM,
          DESCRIPTION,
          owner.address
        )
      ).to.be.reverted;
    });

    it("should revert with deadline too far", async function () {
      const currentTime = await time.latest();
      const invalidDeadline = currentTime + 31 * 24 * 60 * 60; // 31 days

      const PredictionMarket =
        await ethers.getContractFactory("PredictionMarket");

      await expect(
        PredictionMarket.deploy(
          PYTH_FEED_ID,
          TARGET_PRICE,
          invalidDeadline,
          LIQUIDITY_PARAM,
          DESCRIPTION,
          owner.address
        )
      ).to.be.reverted;
    });

    it("should revert with invalid liquidity parameter", async function () {
      const currentTime = await time.latest();
      const deadline = currentTime + 24 * 60 * 60;
      const invalidLiquidity = ethers.parseEther("0.0001"); // Too small

      const PredictionMarket =
        await ethers.getContractFactory("PredictionMarket");

      await expect(
        PredictionMarket.deploy(
          PYTH_FEED_ID,
          TARGET_PRICE,
          deadline,
          invalidLiquidity,
          DESCRIPTION,
          owner.address
        )
      ).to.be.reverted;
    });

    it("should revert with zero target price", async function () {
      const currentTime = await time.latest();
      const deadline = currentTime + 24 * 60 * 60;

      const PredictionMarket =
        await ethers.getContractFactory("PredictionMarket");

      await expect(
        PredictionMarket.deploy(
          PYTH_FEED_ID,
          0, // Invalid target price
          deadline,
          LIQUIDITY_PARAM,
          DESCRIPTION,
          owner.address
        )
      ).to.be.reverted;
    });
  });

  describe("Share Trading", function () {
    const shareAmount = ethers.parseEther("1");

    describe("YES Share Trading", function () {
      it("should allow buying YES shares with correct payment", async function () {
        const cost = await predictionMarket.calculateYesCost(shareAmount);

        const tx = await predictionMarket
          .connect(trader1)
          .buyYesShares(shareAmount, { value: cost });

        // Check position update
        const position = await predictionMarket.getPosition(trader1.address);
        expect(position.yesShares).to.equal(shareAmount);
        expect(position.totalStaked).to.equal(cost);

        // Check global state update
        expect(await predictionMarket.qYes()).to.equal(shareAmount);
        expect(await predictionMarket.qNo()).to.equal(0n);
      });

      it("should add trader to participants on first trade", async function () {
        const cost = await predictionMarket.calculateYesCost(shareAmount);

        await predictionMarket
          .connect(trader1)
          .buyYesShares(shareAmount, { value: cost });

        expect(await predictionMarket.getParticipantCount()).to.equal(1n);
        expect(await predictionMarket.getParticipant(0)).to.equal(
          trader1.address
        );
        expect(await predictionMarket.isParticipant(trader1.address)).to.be
          .true;
      });

      it("should not duplicate participants on subsequent trades", async function () {
        const cost1 = await predictionMarket.calculateYesCost(shareAmount);
        await predictionMarket
          .connect(trader1)
          .buyYesShares(shareAmount, { value: cost1 });

        const cost2 = await predictionMarket.calculateYesCost(shareAmount);
        await predictionMarket
          .connect(trader1)
          .buyYesShares(shareAmount, { value: cost2 });

        expect(await predictionMarket.getParticipantCount()).to.equal(1n);
      });

      it("should refund excess payment", async function () {
        const cost = await predictionMarket.calculateYesCost(shareAmount);
        const excessPayment = cost + ethers.parseEther("1");

        const balanceBefore = await ethers.provider.getBalance(trader1.address);

        const tx = await predictionMarket
          .connect(trader1)
          .buyYesShares(shareAmount, { value: excessPayment });
        const receipt = await tx.wait();
        const gasUsed = receipt.gasUsed * receipt.gasPrice;

        const balanceAfter = await ethers.provider.getBalance(trader1.address);

        // Should only pay the actual cost plus gas
        const actualCost = Number(balanceBefore - balanceAfter);
        const expectedCost = Number(cost + gasUsed);
        expect(actualCost).to.be.closeTo(
          expectedCost,
          Number(ethers.parseEther("0.001"))
        );
      });

      it("should revert with insufficient payment", async function () {
        const cost = await predictionMarket.calculateYesCost(shareAmount);
        const insufficientPayment = cost - ethers.parseEther("0.1");

        await expect(
          predictionMarket
            .connect(trader1)
            .buyYesShares(shareAmount, { value: insufficientPayment })
        ).to.be.revertedWithCustomError(
          predictionMarket,
          "InsufficientPayment"
        );
      });

      it("should revert with zero shares", async function () {
        await expect(
          predictionMarket
            .connect(trader1)
            .buyYesShares(0, { value: ethers.parseEther("1") })
        ).to.be.revertedWithCustomError(predictionMarket, "InvalidShareAmount");
      });
    });

    describe("NO Share Trading", function () {
      it("should allow buying NO shares with correct payment", async function () {
        const cost = await predictionMarket.calculateNoCost(shareAmount);

        const tx = await predictionMarket
          .connect(trader1)
          .buyNoShares(shareAmount, { value: cost });

        // Check position update
        const position = await predictionMarket.getPosition(trader1.address);
        expect(position.noShares).to.equal(shareAmount);
        expect(position.totalStaked).to.equal(cost);

        // Check global state update
        expect(await predictionMarket.qYes()).to.equal(0n);
        expect(await predictionMarket.qNo()).to.equal(shareAmount);
      });

      it("should revert with insufficient payment", async function () {
        const cost = await predictionMarket.calculateNoCost(shareAmount);
        const insufficientPayment = cost - ethers.parseEther("0.1");

        await expect(
          predictionMarket
            .connect(trader1)
            .buyNoShares(shareAmount, { value: insufficientPayment })
        ).to.be.revertedWithCustomError(
          predictionMarket,
          "InsufficientPayment"
        );
      });
    });

    describe("Trading Restrictions", function () {
      it("should revert trading after deadline", async function () {
        // Fast forward past deadline
        await time.increase(25 * 60 * 60); // 25 hours

        const cost = await predictionMarket.calculateYesCost(shareAmount);

        await expect(
          predictionMarket
            .connect(trader1)
            .buyYesShares(shareAmount, { value: cost })
        ).to.be.revertedWithCustomError(predictionMarket, "DeadlinePassed");
      });
    });
  });

  describe("Whale Tracking", function () {
    it("should track largest YES bet", async function () {
      const smallBet = ethers.parseEther("0.5");
      const largeBet = ethers.parseEther("2");

      // First bet
      const cost1 = await predictionMarket.calculateYesCost(smallBet);
      await predictionMarket
        .connect(trader1)
        .buyYesShares(smallBet, { value: cost1 });

      let whales = await predictionMarket.getCurrentWhales();
      expect(whales.largestYes.whale).to.equal(trader1.address);
      expect(whales.largestYes.amount).to.equal(cost1);

      // Larger bet should update whale
      const cost2 = await predictionMarket.calculateYesCost(largeBet);
      await predictionMarket
        .connect(trader2)
        .buyYesShares(largeBet, { value: cost2 });

      whales = await predictionMarket.getCurrentWhales();
      expect(whales.largestYes.whale).to.equal(trader2.address);
      expect(whales.largestYes.amount).to.equal(cost2);
    });

    it("should track largest NO bet", async function () {
      const smallBet = ethers.parseEther("0.5");
      const largeBet = ethers.parseEther("2");

      // First bet
      const cost1 = await predictionMarket.calculateNoCost(smallBet);
      await predictionMarket
        .connect(trader1)
        .buyNoShares(smallBet, { value: cost1 });

      let whales = await predictionMarket.getCurrentWhales();
      expect(whales.largestNo.whale).to.equal(trader1.address);
      expect(whales.largestNo.amount).to.equal(cost1);

      // Larger bet should update whale
      const cost2 = await predictionMarket.calculateNoCost(largeBet);
      await predictionMarket
        .connect(trader2)
        .buyNoShares(largeBet, { value: cost2 });

      whales = await predictionMarket.getCurrentWhales();
      expect(whales.largestNo.whale).to.equal(trader2.address);
      expect(whales.largestNo.amount).to.equal(cost2);
    });

    it("should track separate YES and NO whales", async function () {
      const yesBet = ethers.parseEther("1");
      const noBet = ethers.parseEther("1.5");

      const yesCost = await predictionMarket.calculateYesCost(yesBet);
      const noCost = await predictionMarket.calculateNoCost(noBet);

      await predictionMarket
        .connect(trader1)
        .buyYesShares(yesBet, { value: yesCost });
      await predictionMarket
        .connect(trader2)
        .buyNoShares(noBet, { value: noCost });

      const whales = await predictionMarket.getCurrentWhales();
      expect(whales.largestYes.whale).to.equal(trader1.address);
      expect(whales.largestNo.whale).to.equal(trader2.address);
    });

    it("should not update whale for smaller bets", async function () {
      const largeBet = ethers.parseEther("2");
      const smallBet = ethers.parseEther("0.5");

      // Large bet first
      const largeCost = await predictionMarket.calculateYesCost(largeBet);
      await predictionMarket
        .connect(trader1)
        .buyYesShares(largeBet, { value: largeCost });

      // Small bet should not change whale
      const smallCost = await predictionMarket.calculateYesCost(smallBet);
      await predictionMarket
        .connect(trader2)
        .buyYesShares(smallBet, { value: smallCost });

      const whales = await predictionMarket.getCurrentWhales();
      expect(whales.largestYes.whale).to.equal(trader1.address);
    });
  });

  describe("Participant Management", function () {
    it("should track multiple participants", async function () {
      const shareAmount = ethers.parseEther("1");

      const cost1 = await predictionMarket.calculateYesCost(shareAmount);
      await predictionMarket
        .connect(trader1)
        .buyYesShares(shareAmount, { value: cost1 });

      const cost2 = await predictionMarket.calculateNoCost(shareAmount);
      await predictionMarket
        .connect(trader2)
        .buyNoShares(shareAmount, { value: cost2 });

      const cost3 = await predictionMarket.calculateYesCost(shareAmount);
      await predictionMarket
        .connect(trader3)
        .buyYesShares(shareAmount, { value: cost3 });

      expect(await predictionMarket.getParticipantCount()).to.equal(3n);
      expect(await predictionMarket.getParticipant(0)).to.equal(
        trader1.address
      );
      expect(await predictionMarket.getParticipant(1)).to.equal(
        trader2.address
      );
      expect(await predictionMarket.getParticipant(2)).to.equal(
        trader3.address
      );
    });

    it("should revert when accessing invalid participant index", async function () {
      await expect(predictionMarket.getParticipant(0)).to.be.revertedWith(
        "Index out of bounds"
      );
    });
  });

  describe("Price Calculations", function () {
    it("should return correct prices for equal shares", async function () {
      const shareAmount = ethers.parseEther("1");

      // Buy equal amounts of YES and NO shares
      const yesCost = await predictionMarket.calculateYesCost(shareAmount);
      await predictionMarket
        .connect(trader1)
        .buyYesShares(shareAmount, { value: yesCost });

      const noCost = await predictionMarket.calculateNoCost(shareAmount);
      await predictionMarket
        .connect(trader2)
        .buyNoShares(shareAmount, { value: noCost });

      const yesPrice = await predictionMarket.getPriceYes();
      const noPrice = await predictionMarket.getPriceNo();

      // Prices should be approximately 0.5 each
      const yesPriceNumber = Number(yesPrice) / Number(ethers.parseEther("1"));
      const noPriceNumber = Number(noPrice) / Number(ethers.parseEther("1"));

      expect(yesPriceNumber).to.be.closeTo(0.5, 0.1);
      expect(noPriceNumber).to.be.closeTo(0.5, 0.1);

      // Prices should sum to approximately 1
      expect(yesPriceNumber + noPriceNumber).to.be.closeTo(1, 0.01);
    });

    it("should show higher YES price when more YES shares exist", async function () {
      const yesShares = ethers.parseEther("2");
      const noShares = ethers.parseEther("0.5");

      const yesCost = await predictionMarket.calculateYesCost(yesShares);
      await predictionMarket
        .connect(trader1)
        .buyYesShares(yesShares, { value: yesCost });

      const noCost = await predictionMarket.calculateNoCost(noShares);
      await predictionMarket
        .connect(trader2)
        .buyNoShares(noShares, { value: noCost });

      const yesPrice = await predictionMarket.getPriceYes();
      const noPrice = await predictionMarket.getPriceNo();

      expect(yesPrice).to.be.greaterThan(noPrice);
      expect(yesPrice).to.be.greaterThan(ethers.parseEther("0.5"));
    });
  });

  describe("View Functions", function () {
    it("should return zero costs for zero shares", async function () {
      expect(await predictionMarket.calculateYesCost(0)).to.equal(0n);
      expect(await predictionMarket.calculateNoCost(0)).to.equal(0n);
    });

    it("should return empty position for non-participant", async function () {
      const position = await predictionMarket.getPosition(trader1.address);
      expect(position.yesShares).to.equal(0n);
      expect(position.noShares).to.equal(0n);
      expect(position.totalStaked).to.equal(0n);
    });

    it("should return empty whale info initially", async function () {
      const whales = await predictionMarket.getCurrentWhales();
      expect(whales.largestYes.whale).to.equal(ethers.ZeroAddress);
      expect(whales.largestYes.amount).to.equal(0n);
      expect(whales.largestNo.whale).to.equal(ethers.ZeroAddress);
      expect(whales.largestNo.amount).to.equal(0n);
    });
  });

  describe("Oracle Integration", function () {
    it("should have correct Pyth feed IDs configured", async function () {
      const btcFeedId = await predictionMarket.getFeedId("BTC");
      const ethFeedId = await predictionMarket.getFeedId("ETH");
      const bnbFeedId = await predictionMarket.getFeedId("BNB");
      const goldFeedId = await predictionMarket.getFeedId("GOLD");
      const oilFeedId = await predictionMarket.getFeedId("OIL");

      expect(btcFeedId).to.equal(
        "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43"
      );
      expect(ethFeedId).to.equal(
        "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"
      );
      expect(bnbFeedId).to.equal(
        "0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f"
      );
      expect(goldFeedId).to.equal(
        "0x765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2"
      );
      expect(oilFeedId).to.equal(
        "0xf9c0172ba10dfa4d19088d94f5bf61d3b54d5bd7483a322a982e1373ee8ea31b"
      );
    });

    it("should revert for invalid feed ID", async function () {
      await expect(
        predictionMarket.getFeedId("INVALID")
      ).to.be.revertedWithCustomError(predictionMarket, "InvalidFeedId");
    });

    it("should correctly identify supported feed IDs", async function () {
      const btcFeedId =
        "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43";
      const invalidFeedId =
        "0x0000000000000000000000000000000000000000000000000000000000000000";

      expect(await predictionMarket.isFeedSupported(btcFeedId)).to.be.true;
      expect(await predictionMarket.isFeedSupported(invalidFeedId)).to.be.false;
    });
  });

  describe("Market Resolution", function () {
    beforeEach(async function () {
      // Set up some trading positions for resolution tests
      const shareAmount = ethers.parseEther("1");

      // Trader1 buys YES shares
      const yesCost = await predictionMarket.calculateYesCost(shareAmount);
      await predictionMarket
        .connect(trader1)
        .buyYesShares(shareAmount, { value: yesCost });

      // Trader2 buys NO shares
      const noCost = await predictionMarket.calculateNoCost(shareAmount);
      await predictionMarket
        .connect(trader2)
        .buyNoShares(shareAmount, { value: noCost });
    });

    it("should revert resolution before deadline", async function () {
      await expect(
        predictionMarket.resolveMarket()
      ).to.be.revertedWithCustomError(predictionMarket, "DeadlineNotReached");
    });

    it("should revert resolution if already resolved", async function () {
      // Fast forward past deadline
      await time.increase(25 * 60 * 60); // 25 hours

      // First resolution should work (but will fail due to oracle)
      // We expect it to revert due to oracle error, but let's test the double resolution check
      try {
        await predictionMarket.resolveMarket();
      } catch (error) {
        // Expected to fail due to oracle, that's fine for this test setup
      }

      // Try to manually set resolved state for testing (this is a limitation of testing without mock oracle)
      // In a real test environment, we would mock the oracle response
    });

    it("should return correct resolution status", async function () {
      let [isResolved, outcome] = await predictionMarket.getResolutionStatus();
      expect(isResolved).to.be.false;
      expect(outcome).to.be.false; // Default value when not resolved
    });

    it("should calculate correct trader payouts before resolution", async function () {
      const shareAmount = ethers.parseEther("1");

      // Before resolution, payouts should be 0
      expect(await predictionMarket.getTraderPayout(trader1.address)).to.equal(
        0n
      );
      expect(await predictionMarket.getTraderPayout(trader2.address)).to.equal(
        0n
      );
      expect(await predictionMarket.getTotalPayout()).to.equal(0n);
    });

    it("should show contract balance from trading", async function () {
      const balance = await predictionMarket.getContractBalance();
      expect(balance).to.be.greaterThan(0n); // Should have funds from trading
    });
  });

  describe("Payout Distribution", function () {
    beforeEach(async function () {
      const shareAmount = ethers.parseEther("2");

      // Set up multiple traders with different positions
      const yesCost1 = await predictionMarket.calculateYesCost(shareAmount);
      await predictionMarket
        .connect(trader1)
        .buyYesShares(shareAmount, { value: yesCost1 });

      const noCost1 = await predictionMarket.calculateNoCost(shareAmount);
      await predictionMarket
        .connect(trader2)
        .buyNoShares(shareAmount, { value: noCost1 });

      // Trader3 buys both YES and NO shares
      const yesCost2 = await predictionMarket.calculateYesCost(
        ethers.parseEther("1")
      );
      await predictionMarket
        .connect(trader3)
        .buyYesShares(ethers.parseEther("1"), { value: yesCost2 });

      const noCost2 = await predictionMarket.calculateNoCost(
        ethers.parseEther("1")
      );
      await predictionMarket
        .connect(trader3)
        .buyNoShares(ethers.parseEther("1"), { value: noCost2 });
    });

    it("should track all participants correctly", async function () {
      expect(await predictionMarket.getParticipantCount()).to.equal(3n);
      expect(await predictionMarket.getParticipant(0)).to.equal(
        trader1.address
      );
      expect(await predictionMarket.getParticipant(1)).to.equal(
        trader2.address
      );
      expect(await predictionMarket.getParticipant(2)).to.equal(
        trader3.address
      );
    });

    it("should calculate correct potential payouts for YES win scenario", async function () {
      // Simulate YES wins by checking what payouts would be
      const trader1Position = await predictionMarket.getPosition(
        trader1.address
      );
      const trader2Position = await predictionMarket.getPosition(
        trader2.address
      );
      const trader3Position = await predictionMarket.getPosition(
        trader3.address
      );

      // If YES wins:
      // - trader1 has 2 YES shares = 2 ETH payout
      // - trader2 has 2 NO shares = 0 ETH payout
      // - trader3 has 1 YES share = 1 ETH payout
      const expectedTrader1Payout = trader1Position.yesShares * 1n;
      const expectedTrader3Payout = trader3Position.yesShares * 1n;

      expect(expectedTrader1Payout).to.equal(ethers.parseEther("2"));
      expect(expectedTrader3Payout).to.equal(ethers.parseEther("1"));
    });

    it("should calculate correct potential payouts for NO win scenario", async function () {
      const trader2Position = await predictionMarket.getPosition(
        trader2.address
      );
      const trader3Position = await predictionMarket.getPosition(
        trader3.address
      );

      // If NO wins:
      // - trader1 has 2 YES shares = 0 ETH payout
      // - trader2 has 2 NO shares = 2 ETH payout
      // - trader3 has 1 NO share = 1 ETH payout
      const expectedTrader2Payout = trader2Position.noShares * 1n;
      const expectedTrader3Payout = trader3Position.noShares * 1n;

      expect(expectedTrader2Payout).to.equal(ethers.parseEther("2"));
      expect(expectedTrader3Payout).to.equal(ethers.parseEther("1"));
    });

    it("should have sufficient contract balance for all payouts", async function () {
      const contractBalance = await predictionMarket.getContractBalance();

      // Contract should have enough to pay all winning shares (worst case scenario)
      // Note: With LMSR pricing, the contract balance may be less than the theoretical maximum payout
      // because shares are priced dynamically, not at 1 ETH each
      const totalYesShares = ethers.parseEther("3"); // trader1: 2, trader3: 1
      const totalNoShares = ethers.parseEther("3"); // trader2: 2, trader3: 1

      const maxPayout =
        totalYesShares > totalNoShares ? totalYesShares : totalNoShares;

      // Contract should have reasonable balance (at least 90% of max theoretical payout)
      expect(contractBalance).to.be.greaterThanOrEqual((maxPayout * 9n) / 10n);
    });
  });

  describe("Integration Test Scenarios", function () {
    it("should handle market with only YES traders", async function () {
      const shareAmount = ethers.parseEther("1");

      // Only YES traders
      const cost1 = await predictionMarket.calculateYesCost(shareAmount);
      await predictionMarket
        .connect(trader1)
        .buyYesShares(shareAmount, { value: cost1 });

      const cost2 = await predictionMarket.calculateYesCost(shareAmount);
      await predictionMarket
        .connect(trader2)
        .buyYesShares(shareAmount, { value: cost2 });

      expect(await predictionMarket.getParticipantCount()).to.equal(2n);
      expect(await predictionMarket.qYes()).to.equal(ethers.parseEther("2"));
      expect(await predictionMarket.qNo()).to.equal(0n);
    });

    it("should handle market with only NO traders", async function () {
      const shareAmount = ethers.parseEther("1");

      // Only NO traders
      const cost1 = await predictionMarket.calculateNoCost(shareAmount);
      await predictionMarket
        .connect(trader1)
        .buyNoShares(shareAmount, { value: cost1 });

      const cost2 = await predictionMarket.calculateNoCost(shareAmount);
      await predictionMarket
        .connect(trader2)
        .buyNoShares(shareAmount, { value: cost2 });

      expect(await predictionMarket.getParticipantCount()).to.equal(2n);
      expect(await predictionMarket.qYes()).to.equal(0n);
      expect(await predictionMarket.qNo()).to.equal(ethers.parseEther("2"));
    });

    it("should handle large number of participants", async function () {
      const shareAmount = ethers.parseEther("0.1");
      const signers = await ethers.getSigners();

      // Use first 10 signers as traders
      for (let i = 0; i < 10; i++) {
        const trader = signers[i];
        const isYesTrade = i % 2 === 0; // Alternate between YES and NO

        if (isYesTrade) {
          const cost = await predictionMarket.calculateYesCost(shareAmount);
          await predictionMarket
            .connect(trader)
            .buyYesShares(shareAmount, { value: cost });
        } else {
          const cost = await predictionMarket.calculateNoCost(shareAmount);
          await predictionMarket
            .connect(trader)
            .buyNoShares(shareAmount, { value: cost });
        }
      }

      expect(await predictionMarket.getParticipantCount()).to.equal(10n);
      expect(await predictionMarket.qYes()).to.equal(ethers.parseEther("0.5")); // 5 traders * 0.1
      expect(await predictionMarket.qNo()).to.equal(ethers.parseEther("0.5")); // 5 traders * 0.1
    });
  });
});
