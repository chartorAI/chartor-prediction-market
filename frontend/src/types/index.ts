// Core types for the application
import { ASSETS, MARKET_TYPES } from "@/lib/constants"

export type Asset = (typeof ASSETS)[number]
export type MarketType = (typeof MARKET_TYPES)[number]

export interface PriceMarket {
  id: string
  type: "PRICE"
  pythFeedId: string
  asset: Asset
  targetPrice: bigint
  deadline: number
  liquidityParam: bigint
  description: string
  creator: string
  qYes: bigint
  qNo: bigint
  resolved: boolean
  yesWins: boolean
  currentPrice?: bigint
}

export interface LiquidityMarket {
  id: string
  type: "LIQUIDITY"
  poolAddress: string
  targetLiquidity: bigint
  deadline: number
  liquidityParam: bigint
  description: string
  creator: string
  qYes: bigint
  qNo: bigint
  resolved: boolean
  yesWins: boolean
  currentLiquidity?: bigint
}

export type Market = PriceMarket | LiquidityMarket

export interface Position {
  marketId: string
  userAddress: string
  yesShares: bigint
  noShares: bigint
  totalStaked: bigint
  market: Market
}

export interface PositionWithPayout extends Position {
  potentialPayout: bigint
  actualPayout?: bigint
  profitLoss: bigint
  profitLossPercentage: number
}

export interface WhaleBet {
  address: string
  isYes: boolean
  amount: bigint
  timestamp: number
}

export enum ErrorType {
  WALLET_CONNECTION = "WALLET_CONNECTION",
  TRANSACTION_FAILED = "TRANSACTION_FAILED",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  MARKET_EXPIRED = "MARKET_EXPIRED",
  INVALID_INPUT = "INVALID_INPUT",
  NETWORK_ERROR = "NETWORK_ERROR",
}

export interface AppError {
  type: ErrorType
  message: string
  details?: any
}
