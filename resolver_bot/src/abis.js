// Minimal ABIs - only functions we need
export const PREDICTION_MARKET_ABI = [
  "function getExpiredUnresolvedMarkets() view returns (uint256[])",
  "function resolveMarket(uint256 marketId)",
  "function getMarket(uint256 marketId) view returns (tuple(bytes32 pythFeedId, uint256 targetPrice, uint256 deadline, uint256 liquidityParam, string description, address creator, bool exists))",
  "function getMarketCount() view returns (uint256)",
];

export const LIQUIDITY_MARKET_ABI = [
  "function getExpiredUnresolvedMarkets() view returns (uint256[])",
  "function resolveMarket(uint256 marketId)",
  "function getMarket(uint256 marketId) view returns (tuple(uint256 targetLiquidity, uint256 deadline, uint256 liquidityParam, string description, address creator, bool exists))",
  "function getMarketCount() view returns (uint256)",
];

export const PYTH_ABI = [
  "function updatePriceFeeds(bytes[] calldata updateData) payable",
  "function getUpdateFee(bytes[] calldata updateData) view returns (uint256)",
  "function getPriceUnsafe(bytes32 id) view returns (tuple(int64 price, uint64 conf, int32 expo, uint256 publishTime))",
];
