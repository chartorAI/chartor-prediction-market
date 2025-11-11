// Contract ABIs for PredictionMarket and LiquidityMarket

export const PREDICTION_MARKET_ABI = [
  // Read Functions
  {
    inputs: [],
    name: "getActiveMarkets",
    outputs: [
      { internalType: "uint256[]", name: "activeMarkets", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getResolvedMarkets",
    outputs: [
      { internalType: "uint256[]", name: "resolvedMarkets", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "marketId", type: "uint256" }],
    name: "getMarket",
    outputs: [
      {
        components: [
          { internalType: "bytes32", name: "pythFeedId", type: "bytes32" },
          { internalType: "uint256", name: "targetPrice", type: "uint256" },
          { internalType: "uint256", name: "deadline", type: "uint256" },
          { internalType: "uint256", name: "liquidityParam", type: "uint256" },
          { internalType: "string", name: "description", type: "string" },
          { internalType: "address", name: "creator", type: "address" },
          { internalType: "bool", name: "exists", type: "bool" },
        ],
        internalType: "struct PredictionMarket.MarketConfig",
        name: "config",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "qYes",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "qNo",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "resolved",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "feedId", type: "bytes32" }],
    name: "getMarketsByAsset",
    outputs: [
      { internalType: "uint256[]", name: "assetMarkets", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "marketId", type: "uint256" }],
    name: "getPriceYes",
    outputs: [{ internalType: "uint256", name: "price", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "marketId", type: "uint256" }],
    name: "getPriceNo",
    outputs: [{ internalType: "uint256", name: "price", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "marketId", type: "uint256" },
      { internalType: "address", name: "trader", type: "address" },
    ],
    name: "getPosition",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "yesShares", type: "uint256" },
          { internalType: "uint256", name: "noShares", type: "uint256" },
          { internalType: "uint256", name: "totalStaked", type: "uint256" },
        ],
        internalType: "struct PredictionMarket.Position",
        name: "position",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "marketId", type: "uint256" }],
    name: "getResolutionStatus",
    outputs: [
      { internalType: "bool", name: "isResolved", type: "bool" },
      { internalType: "bool", name: "outcome", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "marketId", type: "uint256" }],
    name: "getCurrentWhales",
    outputs: [
      {
        components: [
          { internalType: "address", name: "whale", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
        ],
        internalType: "struct PredictionMarket.WhaleInfo",
        name: "largestYes",
        type: "tuple",
      },
      {
        components: [
          { internalType: "address", name: "whale", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
        ],
        internalType: "struct PredictionMarket.WhaleInfo",
        name: "largestNo",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "marketId", type: "uint256" }],
    name: "getParticipantCount",
    outputs: [{ internalType: "uint256", name: "count", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "marketId", type: "uint256" }],
    name: "getMarketBalance",
    outputs: [{ internalType: "uint256", name: "balance", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "marketId", type: "uint256" },
      { internalType: "uint256", name: "shares", type: "uint256" },
    ],
    name: "calculateYesCost",
    outputs: [{ internalType: "uint256", name: "cost", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "marketId", type: "uint256" },
      { internalType: "uint256", name: "shares", type: "uint256" },
    ],
    name: "calculateNoCost",
    outputs: [{ internalType: "uint256", name: "cost", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "marketId", type: "uint256" }],
    name: "getCurrentPrice",
    outputs: [
      { internalType: "uint256", name: "price", type: "uint256" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "marketId", type: "uint256" },
      { internalType: "address", name: "trader", type: "address" },
    ],
    name: "getTraderPayout",
    outputs: [{ internalType: "uint256", name: "payout", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // Write Functions
  {
    inputs: [
      { internalType: "bytes32", name: "_pythFeedId", type: "bytes32" },
      { internalType: "uint256", name: "_targetPrice", type: "uint256" },
      { internalType: "uint256", name: "_deadline", type: "uint256" },
      { internalType: "uint256", name: "_liquidityParam", type: "uint256" },
      { internalType: "string", name: "_description", type: "string" },
    ],
    name: "createMarket",
    outputs: [{ internalType: "uint256", name: "marketId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "marketId", type: "uint256" },
      { internalType: "uint256", name: "shares", type: "uint256" },
    ],
    name: "buyYesShares",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "marketId", type: "uint256" },
      { internalType: "uint256", name: "shares", type: "uint256" },
    ],
    name: "buyNoShares",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "marketId", type: "uint256" }],
    name: "resolveMarket",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "marketId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "pythFeedId",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "targetPrice",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "description",
        type: "string",
      },
      {
        indexed: true,
        internalType: "address",
        name: "creator",
        type: "address",
      },
    ],
    name: "MarketCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "marketId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "buyer",
        type: "address",
      },
      { indexed: true, internalType: "bool", name: "isYes", type: "bool" },
      {
        indexed: false,
        internalType: "uint256",
        name: "shares",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "cost",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "SharesPurchased",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "marketId",
        type: "uint256",
      },
      { indexed: false, internalType: "bool", name: "yesWins", type: "bool" },
      {
        indexed: false,
        internalType: "uint256",
        name: "finalPrice",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "MarketResolved",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "marketId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "whale",
        type: "address",
      },
      { indexed: true, internalType: "bool", name: "isYes", type: "bool" },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "WhaleBet",
    type: "event",
  },
] as const

export const LIQUIDITY_MARKET_ABI = [
  // Read Functions
  {
    inputs: [],
    name: "getActiveMarkets",
    outputs: [
      { internalType: "uint256[]", name: "activeMarkets", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getResolvedMarkets",
    outputs: [
      { internalType: "uint256[]", name: "resolvedMarkets", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "marketId", type: "uint256" }],
    name: "getMarket",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "targetLiquidity", type: "uint256" },
          { internalType: "uint256", name: "deadline", type: "uint256" },
          { internalType: "uint256", name: "liquidityParam", type: "uint256" },
          { internalType: "string", name: "description", type: "string" },
          { internalType: "address", name: "creator", type: "address" },
          { internalType: "bool", name: "exists", type: "bool" },
        ],
        internalType: "struct LiquidityMarket.LiquidityMarketConfig",
        name: "config",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "qYes",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "qNo",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "resolved",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "marketId", type: "uint256" }],
    name: "getPriceYes",
    outputs: [{ internalType: "uint256", name: "price", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "marketId", type: "uint256" }],
    name: "getPriceNo",
    outputs: [{ internalType: "uint256", name: "price", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "marketId", type: "uint256" },
      { internalType: "address", name: "trader", type: "address" },
    ],
    name: "getPosition",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "yesShares", type: "uint256" },
          { internalType: "uint256", name: "noShares", type: "uint256" },
          { internalType: "uint256", name: "totalStaked", type: "uint256" },
        ],
        internalType: "struct LiquidityMarket.Position",
        name: "position",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "marketId", type: "uint256" }],
    name: "getResolutionStatus",
    outputs: [
      { internalType: "bool", name: "isResolved", type: "bool" },
      { internalType: "bool", name: "outcome", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "marketId", type: "uint256" }],
    name: "getCurrentWhales",
    outputs: [
      {
        components: [
          { internalType: "address", name: "whale", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
        ],
        internalType: "struct LiquidityMarket.WhaleInfo",
        name: "largestYes",
        type: "tuple",
      },
      {
        components: [
          { internalType: "address", name: "whale", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
        ],
        internalType: "struct LiquidityMarket.WhaleInfo",
        name: "largestNo",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "marketId", type: "uint256" }],
    name: "getParticipantCount",
    outputs: [{ internalType: "uint256", name: "count", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "marketId", type: "uint256" }],
    name: "getMarketBalance",
    outputs: [{ internalType: "uint256", name: "balance", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "marketId", type: "uint256" },
      { internalType: "uint256", name: "shares", type: "uint256" },
    ],
    name: "calculateYesCost",
    outputs: [{ internalType: "uint256", name: "cost", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "marketId", type: "uint256" },
      { internalType: "uint256", name: "shares", type: "uint256" },
    ],
    name: "calculateNoCost",
    outputs: [{ internalType: "uint256", name: "cost", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getCurrentLiquidity",
    outputs: [{ internalType: "uint256", name: "liquidity", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "marketId", type: "uint256" },
      { internalType: "address", name: "trader", type: "address" },
    ],
    name: "getTraderPayout",
    outputs: [{ internalType: "uint256", name: "payout", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Write Functions
  {
    inputs: [
      { internalType: "uint256", name: "_targetLiquidity", type: "uint256" },
      { internalType: "uint256", name: "_deadline", type: "uint256" },
      { internalType: "uint256", name: "_liquidityParam", type: "uint256" },
      { internalType: "string", name: "_description", type: "string" },
    ],
    name: "createLiquidityMarket",
    outputs: [{ internalType: "uint256", name: "marketId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "marketId", type: "uint256" },
      { internalType: "uint256", name: "shares", type: "uint256" },
    ],
    name: "buyYesShares",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "marketId", type: "uint256" },
      { internalType: "uint256", name: "shares", type: "uint256" },
    ],
    name: "buyNoShares",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "marketId", type: "uint256" }],
    name: "resolveMarket",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "marketId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "targetLiquidity",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "description",
        type: "string",
      },
      {
        indexed: true,
        internalType: "address",
        name: "creator",
        type: "address",
      },
    ],
    name: "LiquidityMarketCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "marketId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "buyer",
        type: "address",
      },
      { indexed: true, internalType: "bool", name: "isYes", type: "bool" },
      {
        indexed: false,
        internalType: "uint256",
        name: "shares",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "cost",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "SharesPurchased",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "marketId",
        type: "uint256",
      },
      { indexed: false, internalType: "bool", name: "yesWins", type: "bool" },
      {
        indexed: false,
        internalType: "uint256",
        name: "finalLiquidity",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "targetLiquidity",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "MarketResolved",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "marketId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "whale",
        type: "address",
      },
      { indexed: true, internalType: "bool", name: "isYes", type: "bool" },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "WhaleBet",
    type: "event",
  },
] as const
