import { Provider } from "starknet";
import { EventEmitter } from "events";
import { BaseService } from "./baseService";
import { Cache } from "../utils/cache";
import { ServiceContainer } from "./serviceContainer";
import { withRetry } from "../utils/retry";
import { TradeAnalytics, TradeStatus, GasEstimate } from "../types/dex";

interface TransactionState {
  hash: string;
  status: TradeStatus;
  timestamp: number;
  retryCount: number;
  lastError?: string;
  analytics: TradeAnalytics;
}

export class TransactionManager extends BaseService {
  private static instance: TransactionManager;
  private pendingTransactions: Map<string, TransactionState>;
  private eventEmitter: EventEmitter;

  private constructor(provider: Provider, cache: Cache, container: ServiceContainer) {
    super(provider, cache, container);
    this.pendingTransactions = new Map();
    this.eventEmitter = new EventEmitter();
  }

  public static getInstance(provider: Provider, cache: Cache, container: ServiceContainer): TransactionManager {
    if (!TransactionManager.instance) {
      TransactionManager.instance = new TransactionManager(provider, cache, container);
    }
    return TransactionManager.instance;
  }

  public async submitTransaction(
    account: any,
    contractAddress: string,
    method: string,
    args: any[],
    analytics: TradeAnalytics
  ): Promise<string> {
    try {
      // 准备交易
      const tx = await this.prepareTransaction(
        account,
        contractAddress,
        method,
        args
      );

      // 估算 gas
      const gasEstimate = await this.estimateGas(tx);
      analytics.gasCost = gasEstimate.totalCost;

      // 执行交易
      const result = await withRetry(
        async () => account.execute(tx),
        {
          maxAttempts: 3,
          initialDelay: 1000,
          shouldRetry: (error) => {
            return error.message.includes("nonce") ||
                   error.message.includes("gas");
          }
        }
      );

      const txHash = result.transaction_hash;

      // 记录交易状态
      this.pendingTransactions.set(txHash, {
        hash: txHash,
        status: TradeStatus.PENDING,
        timestamp: Date.now(),
        retryCount: 0,
        analytics
      });

      // 触发事件
      this.eventEmitter.emit("transactionSubmitted", {
        hash: txHash,
        analytics
      });

      return txHash;
    } catch (error) {
      analytics.status = TradeStatus.FAILED;
      throw error;
    }
  }

  private async prepareTransaction(
    account: any,
    contractAddress: string,
    method: string,
    args: any[]
  ): Promise<any> {
    const contract = new (this.provider as any).Contract(
      [], // ABI will be fetched from the contract
      contractAddress,
      account
    );

    return contract.populate(method, args);
  }

  private async estimateGas(tx: any): Promise<GasEstimate> {
    const estimate = await (this.provider as any).estimateInvokeFee(tx);
    
    return {
      gasLimit: BigInt(estimate.gas_consumed || 0),
      gasPrice: BigInt(estimate.gas_price || 0),
      totalCost: BigInt(estimate.overall_fee || 0)
    };
  }

  private startMonitoring(): void {
    if ((this as any).monitoringInterval) {
      clearInterval((this as any).monitoringInterval);
    }

    (this as any).monitoringInterval = setInterval(
      () => this.monitorTransactions(),
      5000 // 每5秒检查一次
    );
  }

  private async monitorTransactions(): Promise<void> {
    const now = Date.now();
    const pendingTxs = Array.from(this.pendingTransactions.entries())
      .filter(([_, state]) => state.status === TradeStatus.PENDING);

    for (const [hash, state] of pendingTxs) {
      try {
        const receipt = await (this.provider as any).getTransactionReceipt(hash);
        
        if (receipt.status === "ACCEPTED_ON_L2") {
          // 交易成功
          state.status = TradeStatus.COMPLETED;
          state.analytics.status = TradeStatus.COMPLETED;
          state.analytics.executionTime = now - state.timestamp;
          
          this.eventEmitter.emit("transactionCompleted", {
            hash,
            receipt,
            analytics: state.analytics
          });

          // 缓存交易分析数据
          await this.cacheAnalytics(state.analytics);
        } else if (receipt.status === "REJECTED") {
          // 交易失败
          state.status = TradeStatus.FAILED;
          state.analytics.status = TradeStatus.FAILED;
          state.lastError = receipt.revert_reason || "Transaction rejected";
          
          this.eventEmitter.emit("transactionFailed", {
            hash,
            error: state.lastError,
            analytics: state.analytics
          });
        } else if (now - state.timestamp > 3600000) { // 1小时超时
          // 交易超时
          state.status = TradeStatus.FAILED;
          state.analytics.status = TradeStatus.FAILED;
          state.lastError = "Transaction timeout";
          
          this.eventEmitter.emit("transactionTimeout", {
            hash,
            analytics: state.analytics
          });
        }

        // 更新交易状态
        this.pendingTransactions.set(hash, state);
      } catch (error) {
        console.error(`Error monitoring transaction ${hash}:`, error);
        
        // 如果重试次数过多，标记为失败
        if (state.retryCount >= 5) {
          state.status = TradeStatus.FAILED;
          state.analytics.status = TradeStatus.FAILED;
          state.lastError = error.message;
          
          this.eventEmitter.emit("transactionFailed", {
            hash,
            error: error.message,
            analytics: state.analytics
          });
        } else {
          state.retryCount++;
        }
        
        this.pendingTransactions.set(hash, state);
      }
    }

    // 清理旧交易
    this.cleanupOldTransactions();
  }

  private async cacheAnalytics(analytics: TradeAnalytics): Promise<void> {
    const cacheKey = `trade_analytics_${analytics.timestamp}`;
    await (this.cache as any).set(cacheKey, analytics, 86400000); // 缓存24小时
  }

  private cleanupOldTransactions(): void {
    const now = Date.now();
    const maxAge = 86400000; // 24小时

    for (const [hash, state] of this.pendingTransactions.entries()) {
      if (
        now - state.timestamp > maxAge &&
        state.status !== TradeStatus.PENDING
      ) {
        this.pendingTransactions.delete(hash);
      }
    }
  }

  public getTransaction(hash: string): TransactionState | undefined {
    return this.pendingTransactions.get(hash);
  }

  public async getTransactionAnalytics(
    startTime: number,
    endTime: number
  ): Promise<TradeAnalytics[]> {
    const analytics: TradeAnalytics[] = [];
    
    // 从缓存中获取分析数据
    const keys = await (this.cache as any).keys();
    const analyticsKeys = keys.filter(key => key.startsWith("trade_analytics_"));
    
    for (const key of analyticsKeys) {
      const data = await (this.cache as any).get<TradeAnalytics>(key);
      if (
        data &&
        data.timestamp >= startTime &&
        data.timestamp <= endTime
      ) {
        analytics.push(data);
      }
    }

    return analytics.sort((a, b) => b.timestamp - a.timestamp);
  }

  public on(event: string, listener: (...args: any[]) => void): this {
    this.eventEmitter.on(event, listener);
    return this;
  }

  public stop(): void {
    if ((this as any).monitoringInterval) {
      clearInterval((this as any).monitoringInterval);
      (this as any).monitoringInterval = null;
    }
  }
}
