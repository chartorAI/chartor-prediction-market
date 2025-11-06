const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("PredictionMarket - Core Functionality", function () {
  let predictionMarket;
  let owner, trader1, trader2;

  // Test constants
  const LIQUIDITY_PARAM = ethers.parseEther("10"); // 10 ETH
  const TARGET_PRICE = ethers.parseEther("50000"); // $50,000
  const DESCRIPTION = "BTC will reach $50,000 by deadline";
  const PYTH_FEED_ID =
    "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43"; // BTC/USD

  beforeEach(async function () {
    [owner, trader1, trader2] = await ethers.getSigners();

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

  describe("Share Trading", function () {
    const shareAmount = ethers.parseEther("1");

    it("should allow buying YES shares", async function () {
      const cost = await predictionMarket.calculateYesCost(shareAmount);

      await predictionMarket
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

    it("should allow buying NO shares", async function () {
      const cost = await predictionMarket.calculateNoCost(shareAmount);

      await predictionMarket
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

    it("should add trader to participants on first trade", async function () {
      const cost = await predictionMarket.calculateYesCost(shareAmount);

      await predictionMarket
        .connect(trader1)
        .buyYesShares(shareAmount, { value: cost });

      expect(await predictionMarket.getParticipantCount()).to.equal(1n);
      expect(await predictionMarket.getParticipant(0)).to.equal(
        trader1.address
      );
      expect(await predictionMarket.isParticipant(trader1.address)).to.be.true;
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

      expect(await predictionMarket.getParticipantCount()).to.equal(2n);
      expect(await predictionMarket.getParticipant(0)).to.equal(
        trader1.address
      );
      expect(await predictionMarket.getParticipant(1)).to.equal(
        trader2.address
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

      expect(Number(yesPrice)).to.be.greaterThan(Number(noPrice));
      expect(Number(yesPrice)).to.be.greaterThan(
        Number(ethers.parseEther("0.5"))
      );
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
});
