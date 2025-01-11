import { Account } from "starknet";

export interface PoolInfo {
  reserve0: string;
  reserve1: string;
  fee: string;
  token0: string;
  token1: string;
  address: string;
  lastUpdateTime: number;
}

export interface SwapPath {
  tokens: string[];
  pools: string[];
  expectedOutput: bigint;
  priceImpact: number;
}

export interface SwapParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  slippageTolerance: number;
  deadline?: number;
}

export interface SwapEstimate {
  expectedOutput: bigint;
  minimumOutput: bigint;
  priceImpact: number;
  path: SwapPath;
  gasEstimate: bigint;
}

export interface TokenPrice {
  token: string;
  price: number;
  timestamp: number;
  priceChange24h: number;
}

export enum PriceAlertCondition {
  ABOVE = "above",
  BELOW = "below",
  PERCENT_CHANGE = "percent_change"
}

export interface PriceAlert {
  tokenAddress: string;
  condition: PriceAlertCondition;
  targetPrice: number;
  callback: (price: TokenPrice) => void;
}

export interface GasEstimate {
  gasLimit: bigint;
  gasPrice: bigint;
  totalCost: bigint;
  estimatedWaitTime: number;
}

export enum TradeStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED"
}

export interface TradeAnalytics {
  timestamp: number;
  tokenIn: string;
  tokenOut: string;
  amountIn: bigint;
  amountOut: bigint;
  priceImpact: number;
  gasCost: bigint;
  route: string[];
  status: TradeStatus;
  executionTime: number;
}

export interface PriceHistory {
  timestamp: number;
  price: number;
  volume: number;
  trades: number;
}

export interface MarketDepth {
  price: number;
  quantity: number;
  total: number;
  side: "buy" | "sell";
}

export interface LiquidityAnalytics {
  poolAddress: string;
  token0Volume24h: number;
  token1Volume24h: number;
  volumeChange24h: number;
  tvlUSD: number;
  tvlChange24h: number;
  apy: number;
  impermanentLoss: number;
}

export interface TradingMetrics {
  successRate: number;
  averageSlippage: number;
  averageGasCost: bigint;
  totalTrades: number;
  totalVolume: number;
  profitLoss: number;
  bestRoute: string[];
  worstRoute: string[];
}

export interface PriceSource {
  name: string;
  price: number;
  weight: number;
  lastUpdate: number;
  confidence: number;
}

export interface TokenMetadata {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  totalSupply: bigint;
  logoURI?: string;
}

export interface TransactionStatus {
  hash: string;
  status: 'pending' | 'success' | 'failed' | 'rejected';
  timestamp: number;
  blockNumber?: number;
  gasUsed?: bigint;
  error?: string;
}

export interface RetryOptions {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}
