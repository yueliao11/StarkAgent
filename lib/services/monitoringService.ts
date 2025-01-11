import { Provider } from "starknet";
import { EventEmitter } from "events";
import { BaseService } from "./baseService";
import { Cache } from "../utils/cache";
import { ServiceContainer } from "./serviceContainer";
import { TransactionManager } from "./transactionManager";
import { PriceService } from "./priceService";
import {
  TradeAnalytics,
  PriceAlert,
  PriceAlertCondition,
  TokenPrice,
  TradingMetrics,
  LiquidityAnalytics
} from "../types/dex";

interface SystemMetrics {
  timestamp: number;
  cacheHitRate: number;
  apiLatency: number;
  errorRate: number;
  activeTransactions: number;
}

interface AlertConfig {
  id: string;
  type: "price" | "system" | "trade";
  condition: any;
  callback: (data: any) => void;
}

export class MonitoringService extends EventEmitter {
  private static instance: MonitoringService;
  private txManager: TransactionManager;
  private priceService: PriceService;
  private alerts: Map<string, AlertConfig>;
  private metricsInterval: NodeJS.Timeout | null = null;
  private errorCounts: Map<string, number>;
  private requestCounts: Map<string, number>;
  private cache: Cache;
  private container: ServiceContainer;

  private constructor(provider: Provider, cache: Cache, container: ServiceContainer) {
    super();
    this.cache = cache;
    this.alerts = new Map();
    this.errorCounts = new Map();
    this.requestCounts = new Map();
    this.container = container;
  }

  protected initialize() {
    this.txManager = this.container.getService(TransactionManager);
    this.priceService = this.container.getService(PriceService);
    this.setupEventListeners();
    this.startMetricsCollection();
  }

  public static getInstance(provider: Provider, cache: Cache, container: ServiceContainer): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService(provider, cache, container);
      MonitoringService.instance.initialize();
    }
    return MonitoringService.instance;
  }

  private setupEventListeners(): void {
    // 监听交易事件
    this.txManager.on("transactionSubmitted", this.handleTransactionSubmitted.bind(this));
    this.txManager.on("transactionCompleted", this.handleTransactionCompleted.bind(this));
    this.txManager.on("transactionFailed", this.handleTransactionFailed.bind(this));
    this.txManager.on("transactionTimeout", this.handleTransactionTimeout.bind(this));

    // 监听缓存事件
    this.cache.on("hit", this.handleCacheHit.bind(this));
    this.cache.on("miss", this.handleCacheMiss.bind(this));
    this.cache.on("error", this.handleCacheError.bind(this));
  }

  private startMetricsCollection(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    this.metricsInterval = setInterval(
      () => this.collectMetrics(),
      60000 // 每分钟收集一次指标
    );
  }

  private async collectMetrics(): Promise<void> {
    const metrics: SystemMetrics = {
      timestamp: Date.now(),
      cacheHitRate: this.calculateCacheHitRate(),
      apiLatency: await this.measureApiLatency(),
      errorRate: this.calculateErrorRate(),
      activeTransactions: this.countActiveTransactions()
    };

    // 缓存指标
    await this.cache.set(
      `system_metrics_${metrics.timestamp}`,
      metrics,
      86400000 // 24小时
    );

    // 检查系统警报
    this.checkSystemAlerts(metrics);

    // 发出指标事件
    this.emit("metricsCollected", metrics);
  }

  private calculateCacheHitRate(): number {
    const hits = this.requestCounts.get("cacheHits") || 0;
    const misses = this.requestCounts.get("cacheMisses") || 0;
    const total = hits + misses;
    return total > 0 ? (hits / total) * 100 : 0;
  }

  private async measureApiLatency(): Promise<number> {
    const start = Date.now();
    try {
      await this.txManager.provider.getBlockNumber();
      return Date.now() - start;
    } catch {
      return -1;
    }
  }

  private calculateErrorRate(): number {
    const errors = Array.from(this.errorCounts.values())
      .reduce((sum, count) => sum + count, 0);
    const total = Array.from(this.requestCounts.values())
      .reduce((sum, count) => sum + count, 0);
    return total > 0 ? (errors / total) * 100 : 0;
  }

  private countActiveTransactions(): number {
    // TODO: Implement active transaction counting
    return 0;
  }

  public async addPriceAlert(alert: PriceAlert): Promise<string> {
    const id = `price_alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.alerts.set(id, {
      id,
      type: "price",
      condition: {
        type: alert.condition,
        price: alert.targetPrice
      },
      callback: alert.callback
    });

    // 开始价格监控
    this.priceService.monitorPrice(
      alert.tokenAddress,
      (price) => this.checkPriceAlert(id, price)
    );

    return id;
  }

  private checkPriceAlert(alertId: string, price: TokenPrice): void {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.type !== "price") return;

    const { type, price: targetPrice } = alert.condition;
    let triggered = false;

    switch (type) {
      case PriceAlertCondition.ABOVE:
        triggered = price.currentPrice > targetPrice;
        break;
      case PriceAlertCondition.BELOW:
        triggered = price.currentPrice < targetPrice;
        break;
      case PriceAlertCondition.PERCENT_CHANGE:
        const change = Math.abs(
          ((price.currentPrice - targetPrice) / targetPrice) * 100
        );
        triggered = change >= Math.abs(targetPrice);
        break;
    }

    if (triggered) {
      alert.callback(price);
      this.alerts.delete(alertId);
    }
  }

  private checkSystemAlerts(metrics: SystemMetrics): void {
    const systemAlerts = Array.from(this.alerts.values())
      .filter(alert => alert.type === "system");

    for (const alert of systemAlerts) {
      const { metric, threshold, operator } = alert.condition;
      const value = metrics[metric as keyof SystemMetrics];

      let triggered = false;
      switch (operator) {
        case ">":
          triggered = value > threshold;
          break;
        case "<":
          triggered = value < threshold;
          break;
        case ">=":
          triggered = value >= threshold;
          break;
        case "<=":
          triggered = value <= threshold;
          break;
      }

      if (triggered) {
        alert.callback(metrics);
        this.alerts.delete(alert.id);
      }
    }
  }

  public async getTradingMetrics(
    startTime: number,
    endTime: number
  ): Promise<TradingMetrics> {
    const analytics = await this.txManager.getTransactionAnalytics(
      startTime,
      endTime
    );

    const successfulTrades = analytics.filter(
      a => a.status === "completed"
    );

    const totalTrades = analytics.length;
    const successRate = totalTrades > 0
      ? (successfulTrades.length / totalTrades) * 100
      : 0;

    const averageSlippage = successfulTrades.length > 0
      ? successfulTrades.reduce((sum, a) => sum + a.priceImpact, 0) / successfulTrades.length
      : 0;

    const averageGasCost = successfulTrades.length > 0
      ? successfulTrades.reduce((sum, a) => sum + a.gasCost, BigInt(0)) / BigInt(successfulTrades.length)
      : BigInt(0);

    const totalVolume = successfulTrades.reduce(
      (sum, a) => sum + Number(a.amountIn),
      0
    );

    // TODO: Implement profit/loss calculation
    const profitLoss = 0;

    // 找出最佳和最差路由
    const routePerformance = new Map<string, number>();
    for (const trade of successfulTrades) {
      const routeKey = trade.route.join("->");
      const performance = trade.amountOut / trade.amountIn;
      routePerformance.set(
        routeKey,
        (routePerformance.get(routeKey) || 0) + performance
      );
    }

    const sortedRoutes = Array.from(routePerformance.entries())
      .sort((a, b) => b[1] - a[1]);

    return {
      successRate,
      averageSlippage,
      averageGasCost,
      totalTrades,
      totalVolume,
      profitLoss,
      bestRoute: sortedRoutes[0]?.[0].split("->") || [],
      worstRoute: sortedRoutes[sortedRoutes.length - 1]?.[0].split("->") || []
    };
  }

  private handleTransactionSubmitted(data: any): void {
    this.incrementCounter("transactions");
    this.emit("transactionSubmitted", data);
  }

  private handleTransactionCompleted(data: any): void {
    this.incrementCounter("completedTransactions");
    this.emit("transactionCompleted", data);
  }

  private handleTransactionFailed(data: any): void {
    this.incrementCounter("failedTransactions");
    this.incrementError("transaction");
    this.emit("transactionFailed", data);
  }

  private handleTransactionTimeout(data: any): void {
    this.incrementCounter("timeoutTransactions");
    this.incrementError("timeout");
    this.emit("transactionTimeout", data);
  }

  private handleCacheHit(): void {
    this.incrementCounter("cacheHits");
  }

  private handleCacheMiss(): void {
    this.incrementCounter("cacheMisses");
  }

  private handleCacheError(error: Error): void {
    this.incrementError("cache");
    this.emit("error", { type: "cache", error });
  }

  private incrementCounter(key: string): void {
    this.requestCounts.set(
      key,
      (this.requestCounts.get(key) || 0) + 1
    );
  }

  private incrementError(type: string): void {
    this.errorCounts.set(
      type,
      (this.errorCounts.get(type) || 0) + 1
    );
  }

  public removeAlert(alertId: string): boolean {
    return this.alerts.delete(alertId);
  }

  public stop(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }
}
