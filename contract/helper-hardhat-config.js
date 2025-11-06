const networkConfig = {
  31337: {
    name: "hardhat",
  },
  97: {
    name: "bnbTestnet",
    pythOracle: "0x5744Cbf430D99456a0A8771208b674F27f8EF0Fb",
    // Pyth feed IDs for supported assets
    pythFeeds: {
      "BTC/USD":
        "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
      "ETH/USD":
        "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
      "BNB/USD":
        "0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f",
    },
  },
};

const developmentChains = ["hardhat", "localhost"];
const VERIFICATION_BLOCK_CONFIRMATIONS = 6;

module.exports = {
  networkConfig,
  developmentChains,
  VERIFICATION_BLOCK_CONFIRMATIONS,
};
