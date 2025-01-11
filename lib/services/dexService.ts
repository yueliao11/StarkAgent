import { Account, Contract, Provider } from "starknet";
import { EventEmitter } from "events";
import { CONTRACTS, DEX_CONFIG, EVENTS } from "../constants";
import { withRetry } from "../utils/retry";
import { BaseService } from "./baseService";
import { ServiceContainer } from "./serviceContainer";
import { Cache } from "../utils/cache";
import { ekuboRouterABI, ekuboPoolABI } from "../abi/ekubo";
import {
  SwapParams,
  SwapPath,
  SwapEstimate,
  TradeAnalytics,
  PoolInfo,
  TradeStatus
} from "../types/dex";

export class DexService extends BaseService {
  private static instance: DexService;
  private eventEmitter: EventEmitter;

  private constructor(provider: Provider, cache: Cache, container: ServiceContainer) {
    super(provider, cache, container);
    this.eventEmitter = new EventEmitter();
  }

  public static getInstance(provider: Provider, cache: Cache, container: ServiceContainer): DexService {
    if (!DexService.instance) {
      DexService.instance = new DexService(provider, cache, container);
    }
    return DexService.instance;
  }

  protected async initialize() {
    // 初始化时可以预加载一些数据
    await this.preloadCommonPools();
  }

  private async preloadCommonPools() {
    // 预加载常用交易对的池子信息
    const commonPairs = [
      { tokenA: CONTRACTS.TOKENS.ETH, tokenB: CONTRACTS.TOKENS.USDC },
      { tokenA: CONTRACTS.TOKENS.ETH, tokenB: CONTRACTS.TOKENS.USDT },
      { tokenA: CONTRACTS.TOKENS.USDC, tokenB: CONTRACTS.TOKENS.USDT }
    ];

    for (const pair of commonPairs) {
      try {
        const poolInfo = await this.getPoolInfo(pair.tokenA + "_" + pair.tokenB);
        this.cache.set(`pool_${pair.tokenA}_${pair.tokenB}`, poolInfo);
      } catch (error) {
        console.warn(`Failed to preload pool info for ${pair.tokenA}_${pair.tokenB}:`, error);
      }
    }
  }

  public async findBestSwapPath(params: SwapParams): Promise<SwapPath> {
    try {
      // 1. 尝试 Ekubo
      const ekuboPath = await this.findBestSwapPathOnEkubo(params);
      if (ekuboPath) {
        return ekuboPath;
      }

      throw new Error("No suitable swap path found on available DEXs.");
    } catch (error: any) {
      console.error("Error finding best swap path:", error);
      throw new Error(`Failed to find best swap path: ${error.message}`);
    }
  }

  private async findBestSwapPathOnEkubo(params: SwapParams): Promise<SwapPath | null> {
    try {
      const router = new Contract(
        ekuboRouterABI,
        CONTRACTS.EKUBO.ROUTER,
        this.provider
      );

      const result = await router.get_amounts_out(
        params.tokenIn,
        params.tokenOut,
        params.amountIn
      );

      const expectedOutput = BigInt(result.amount_out.toString());
      const priceImpact = Number(result.price_impact.toString()) / 10000; // 转换为百分比

      return {
        tokens: [params.tokenIn, params.tokenOut],
        pools: [CONTRACTS.EKUBO.ROUTER],
        expectedOutput,
        priceImpact
      };
    } catch (error) {
      console.warn("Error finding swap path on Ekubo:", error);
      return null;
    }
  }

  public async estimateSwap(params: SwapParams): Promise<SwapEstimate> {
    const path = await this.findBestSwapPath(params);
    const gasEstimate = await this.estimateGas(path);

    return {
      expectedOutput: path.expectedOutput,
      minimumOutput: this.calculateMinimumOutput(
        path.expectedOutput,
        params.slippageTolerance
      ),
      priceImpact: path.priceImpact,
      path,
      gasEstimate
    };
  }

  private calculateMinimumOutput(
    expectedOutput: bigint,
    slippageTolerance: number
  ): bigint {
    const slippageMultiplier = 1 - Math.min(slippageTolerance, DEX_CONFIG.MAX_SLIPPAGE_TOLERANCE);
    return BigInt(
      (Number(expectedOutput) * slippageMultiplier).toFixed(0)
    );
  }

  private async estimateGas(path: SwapPath): Promise<bigint> {
    // Base cost for swap
    let baseCost = BigInt(100000);
    
    // Additional cost per hop
    const hopCost = BigInt(50000);
    
    // Calculate total gas estimate
    const totalCost = baseCost + (BigInt(path.pools.length - 1) * hopCost);
    
    // Add buffer (multiply by 110 and divide by 100 to add 10%)
    return (totalCost * BigInt(110)) / BigInt(100);
  }

  public async executeSwap(
    account: Account,
    params: SwapParams
  ): Promise<string> {
    try {
      const startTime = Date.now();
      const estimate = await this.estimateSwap(params);
      
      // 发出交易开始事件
      this.emit(EVENTS.SWAP_STARTED, {
        params,
        estimate,
        timestamp: startTime
      });

      // 创建交易分析对象
      const analytics: TradeAnalytics = {
        timestamp: startTime,
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amountIn: BigInt(params.amountIn),
        amountOut: estimate.expectedOutput,
        priceImpact: estimate.priceImpact,
        gasCost: estimate.gasEstimate,
        route: estimate.path.tokens,
        status: TradeStatus.PENDING,
        executionTime: 0
      };

      // 执行交易
      const txHash = await this.executeSingleHopSwap(
        account,
        params,
        estimate,
        analytics
      );

      // 更新分析数据
      analytics.status = TradeStatus.COMPLETED;
      analytics.executionTime = Date.now() - startTime;

      // 发出交易完成事件
      this.emit(EVENTS.SWAP_COMPLETED, {
        txHash,
        analytics,
        timestamp: Date.now()
      });

      return txHash;
    } catch (error: any) {
      // 如果是路径查找错误，重新抛出
      if (error.message.includes('Failed to find best swap path')) {
        throw error;
      }
      
      // 发出交易失败事件
      this.emit(EVENTS.SWAP_FAILED, {
        error,
        params,
        timestamp: Date.now()
      });
      
      throw new Error('Swap failed: ' + error.message);
    }
  }

  private async executeSingleHopSwap(
    account: Account,
    params: SwapParams,
    estimate: SwapEstimate,
    analytics: TradeAnalytics
  ): Promise<string> {
    try {
      const router = new Contract(
        ekuboRouterABI,
        CONTRACTS.EKUBO.ROUTER,
        account
      );

      const result = await withRetry(async () => {
        return router.swap(
          params.tokenIn,
          params.tokenOut,
          params.amountIn,
          estimate.minimumOutput
        );
      });

      return result.transaction_hash;
    } catch (error: any) {
      console.error("Error executing single hop swap:", error);
      throw new Error(`Failed to execute single hop swap: ${error.message}`);
    }
  }

  public async getPoolInfo(poolAddress: string): Promise<PoolInfo> {
    try {
      const pool = new Contract(
        ekuboPoolABI,
        poolAddress,
        this.provider
      );

      const [reserves, fee, tokens] = await Promise.all([
        pool.get_reserves(),
        pool.get_fee(),
        pool.get_tokens()
      ]);

      return {
        reserve0: reserves.reserve0.toString(),
        reserve1: reserves.reserve1.toString(),
        fee: fee.toString(),
        token0: tokens.token0.toString(),
        token1: tokens.token1.toString(),
        address: poolAddress,
        lastUpdateTime: Date.now()
      };
    } catch (error: any) {
      console.error(`Error getting pool info for address ${poolAddress}:`, error);
      throw new Error(`Failed to get pool info: ${error.message}`);
    }
  }

  // Event handling methods
  public on(event: string, listener: (...args: any[]) => void): this {
    this.eventEmitter.on(event, listener);
    return this;
  }

  public off(event: string, listener: (...args: any[]) => void): this {
    this.eventEmitter.off(event, listener);
    return this;
  }

  public emit(event: string, ...args: any[]): boolean {
    return this.eventEmitter.emit(event, ...args);
  }
}
