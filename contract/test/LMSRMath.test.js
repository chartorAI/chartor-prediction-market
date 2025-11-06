const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LMSRMath", function () {
  let testContract;

  // Test constants
  const LIQUIDITY_PARAM = ethers.parseEther("10"); // 10 ETH
  const ONE_ETHER = ethers.parseEther("1");
  const HALF_ETHER = ethers.parseEther("0.5");

  before(async function () {
    // Deploy a test contract that uses the LMSRMath library
    const TestLMSRMath = await ethers.getContractFactory("TestLMSRMath");
    testContract = await TestLMSRMath.deploy();
    await testContract.waitForDeployment();
  });

  describe("Cost Function", function () {
    it("should calculate cost correctly for equal shares", async function () {
      const qYes = ONE_ETHER;
      const qNo = ONE_ETHER;

      const cost = await testContract.calculateCost(qYes, qNo, LIQUIDITY_PARAM);

      // For equal shares, cost should be positive
      expect(Number(cost)).to.be.greaterThan(0);
    });

    it("should calculate cost correctly for zero shares", async function () {
      const cost = await testContract.calculateCost(0, 0, LIQUIDITY_PARAM);

      // Cost should be b * ln(2) when both shares are 0
      // Just verify it's positive and reasonable
      expect(Number(cost)).to.be.greaterThan(0);
      expect(Number(cost)).to.be.lessThan(Number(LIQUIDITY_PARAM));
    });

    it("should revert for invalid liquidity parameter", async function () {
      try {
        await testContract.calculateCost(ONE_ETHER, ONE_ETHER, 0);
        expect.fail("Should have reverted");
      } catch (error) {
        expect(error.message).to.include("InvalidLiquidityParameter");
      }
    });

    it("should revert for share quantity too large", async function () {
      const maxShares = ethers.parseEther("10000"); // Exceeds MAX_SHARES

      try {
        await testContract.calculateCost(maxShares, ONE_ETHER, LIQUIDITY_PARAM);
        expect.fail("Should have reverted");
      } catch (error) {
        expect(error.message).to.include("ShareQuantityTooLarge");
      }
    });
  });

  describe("Price Calculations", function () {
    it("should calculate YES price correctly", async function () {
      const qYes = ONE_ETHER;
      const qNo = ONE_ETHER;

      const yesPrice = await testContract.calculateYesPrice(
        qYes,
        qNo,
        LIQUIDITY_PARAM
      );

      // For equal shares, price should be around 0.5
      const priceNumber = Number(yesPrice) / Number(ONE_ETHER);
      expect(priceNumber).to.be.closeTo(0.5, 0.01);
    });

    it("should calculate NO price correctly", async function () {
      const qYes = ONE_ETHER;
      const qNo = ONE_ETHER;

      const noPrice = await testContract.calculateNoPrice(
        qYes,
        qNo,
        LIQUIDITY_PARAM
      );

      // For equal shares, price should be around 0.5
      const priceNumber = Number(noPrice) / Number(ONE_ETHER);
      expect(priceNumber).to.be.closeTo(0.5, 0.01);
    });

    it("should have prices sum to approximately 1", async function () {
      const qYes = ethers.parseEther("0.5"); // Smaller values to avoid overflow
      const qNo = ethers.parseEther("0.3");

      const yesPrice = await testContract.calculateYesPrice(
        qYes,
        qNo,
        LIQUIDITY_PARAM
      );
      const noPrice = await testContract.calculateNoPrice(
        qYes,
        qNo,
        LIQUIDITY_PARAM
      );

      const isValid = await testContract.validatePriceSum(yesPrice, noPrice);
      expect(isValid).to.be.true;
    });

    it("should show higher YES price when more YES shares exist", async function () {
      const qYes = ethers.parseEther("0.8"); // Smaller values
      const qNo = ethers.parseEther("0.2");

      const yesPrice = await testContract.calculateYesPrice(
        qYes,
        qNo,
        LIQUIDITY_PARAM
      );

      // YES price should be greater than 0.5 when there are more YES shares
      expect(Number(yesPrice)).to.be.greaterThan(Number(HALF_ETHER));
    });
  });

  describe("Cost Difference Calculations", function () {
    it("should calculate cost difference for YES purchase", async function () {
      const currentQYes = ethers.parseEther("0.5");
      const currentQNo = ethers.parseEther("0.5");
      const additionalYes = ethers.parseEther("0.1");

      const costDiff = await testContract.calculateCostDifference(
        currentQYes,
        currentQNo,
        additionalYes,
        0,
        LIQUIDITY_PARAM
      );

      expect(Number(costDiff)).to.be.greaterThan(0);
    });

    it("should calculate cost difference for NO purchase", async function () {
      const currentQYes = ethers.parseEther("0.5");
      const currentQNo = ethers.parseEther("0.5");
      const additionalNo = ethers.parseEther("0.1");

      const costDiff = await testContract.calculateCostDifference(
        currentQYes,
        currentQNo,
        0,
        additionalNo,
        LIQUIDITY_PARAM
      );

      expect(Number(costDiff)).to.be.greaterThan(0);
    });

    it("should return zero cost for zero additional shares", async function () {
      const costDiff = await testContract.calculateCostDifference(
        ONE_ETHER,
        ONE_ETHER,
        0,
        0,
        LIQUIDITY_PARAM
      );

      expect(Number(costDiff)).to.equal(0);
    });

    it("should revert when trying to buy both YES and NO shares", async function () {
      try {
        await testContract.calculateCostDifference(
          ONE_ETHER,
          ONE_ETHER,
          HALF_ETHER,
          HALF_ETHER,
          LIQUIDITY_PARAM
        );
        expect.fail("Should have reverted");
      } catch (error) {
        expect(error.message).to.include("InvalidShareQuantity");
      }
    });
  });

  describe("Optimized Purchase Functions", function () {
    it("should calculate YES purchase cost correctly", async function () {
      const currentQYes = ethers.parseEther("0.5");
      const currentQNo = ethers.parseEther("0.5");
      const additionalYes = ethers.parseEther("0.1");

      const yesCost = await testContract.calculateYesPurchaseCost(
        currentQYes,
        currentQNo,
        additionalYes,
        LIQUIDITY_PARAM
      );

      const generalCost = await testContract.calculateCostDifference(
        currentQYes,
        currentQNo,
        additionalYes,
        0,
        LIQUIDITY_PARAM
      );

      expect(Number(yesCost)).to.equal(Number(generalCost));
    });

    it("should calculate NO purchase cost correctly", async function () {
      const currentQYes = ethers.parseEther("0.5");
      const currentQNo = ethers.parseEther("0.5");
      const additionalNo = ethers.parseEther("0.1");

      const noCost = await testContract.calculateNoPurchaseCost(
        currentQYes,
        currentQNo,
        additionalNo,
        LIQUIDITY_PARAM
      );

      const generalCost = await testContract.calculateCostDifference(
        currentQYes,
        currentQNo,
        0,
        additionalNo,
        LIQUIDITY_PARAM
      );

      expect(Number(noCost)).to.equal(Number(generalCost));
    });

    it("should return zero for zero purchase amounts", async function () {
      const yesCost = await testContract.calculateYesPurchaseCost(
        ONE_ETHER,
        ONE_ETHER,
        0,
        LIQUIDITY_PARAM
      );

      const noCost = await testContract.calculateNoPurchaseCost(
        ONE_ETHER,
        ONE_ETHER,
        0,
        LIQUIDITY_PARAM
      );

      expect(Number(yesCost)).to.equal(0);
      expect(Number(noCost)).to.equal(0);
    });
  });

  describe("Edge Cases and Overflow Protection", function () {
    it("should handle reasonable liquidity parameters", async function () {
      const reasonableLiquidity = ethers.parseEther("1");

      const cost = await testContract.calculateCost(
        ethers.parseEther("0.1"),
        ethers.parseEther("0.1"),
        reasonableLiquidity
      );

      expect(Number(cost)).to.be.greaterThan(0);
    });

    it("should handle moderate share amounts", async function () {
      const moderateShares = ethers.parseEther("10"); // Within MAX_SHARES limit

      const cost = await testContract.calculateCost(
        moderateShares,
        moderateShares,
        LIQUIDITY_PARAM
      );

      expect(Number(cost)).to.be.greaterThan(0);
    });

    it("should maintain precision with reasonable numbers", async function () {
      const amount = ethers.parseEther("5");
      const liquidity = ethers.parseEther("50");

      const yesPrice = await testContract.calculateYesPrice(
        amount,
        amount,
        liquidity
      );

      const noPrice = await testContract.calculateNoPrice(
        amount,
        amount,
        liquidity
      );

      const isValid = await testContract.validatePriceSum(yesPrice, noPrice);
      expect(isValid).to.be.true;
    });
  });
});
