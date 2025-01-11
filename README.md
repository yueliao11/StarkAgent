# StarkAgent DEX Trading System

StarkAgent 是一个在 Starknet 上运行的高级 DEX 交易系统，提供智能路由、价格监控和自动交易功能。

## 功能特点

- 智能路由：自动找到最优交易路径
- 价格监控：实时监控代币价格
- 自动交易：基于预设条件自动执行交易
- 交易管理：完整的交易生命周期管理
- 系统监控：实时性能监控和警报系统

## 快速开始

1. 安装依赖
```bash
npm install
```

2. 设置环境变量
```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，添加你的账户信息：
```
ACCOUNT_ADDRESS=your_account_address
PRIVATE_KEY=your_private_key
```

3. 运行简单交易示例
```bash
ts-node examples/simple_swap.ts
```

## 使用示例

### 基本交易
```typescript
import { Provider, Account } from "starknet";
import { DexService } from "./lib/services/dexService";
import { TOKENS } from "./config/tokens";

// 初始化服务
const provider = new Provider({ sequencer: { network: "mainnet-alpha" } });
const dexService = DexService.getInstance(provider);

// 设置账户
const account = new Account(provider, process.env.ACCOUNT_ADDRESS!, process.env.PRIVATE_KEY!);

// 执行交易
const swapParams = {
    tokenIn: TOKENS.ETH.address,
    tokenOut: TOKENS.USDC.address,
    amountIn: "1000000000000000000", // 1 ETH
    slippageTolerance: 0.005, // 0.5%
    deadline: 300 // 5 minutes
};

// 获取估算
const estimate = await dexService.estimateSwap(swapParams);

// 执行交易
const txHash = await dexService.executeSwap(account, swapParams);
```

### 设置价格警报
```typescript
import { MonitoringService } from "./lib/services/monitoringService";
import { PriceAlertCondition } from "./lib/types/dex";

const monitoring = MonitoringService.getInstance(provider);

// 设置价格警报
const alertId = await monitoring.addPriceAlert({
    tokenAddress: TOKENS.ETH.address,
    condition: PriceAlertCondition.ABOVE,
    targetPrice: 2000,
    callback: (price) => {
        console.log(`Alert triggered! ETH price: ${price.currentPrice}`);
    }
});
```

### 监控系统指标
```typescript
monitoring.on("metricsCollected", (metrics) => {
    console.log("System metrics:", {
        cacheHitRate: metrics.cacheHitRate,
        apiLatency: metrics.apiLatency,
        errorRate: metrics.errorRate,
        activeTransactions: metrics.activeTransactions
    });
});
```

## 高级功能

### 智能路由
系统会自动找到最优的交易路径，考虑以下因素：
- 流动性深度
- 价格影响
- Gas 成本
- 交易费用

### 价格监控
支持多种价格监控策略：
- 价格突破
- 百分比变化
- 价格区间
- 趋势跟踪

### 交易管理
完整的交易生命周期管理：
- 自动重试
- 状态跟踪
- 失败恢复
- 交易分析

### 系统监控
实时监控系统性能：
- API 延迟
- 缓存命中率
- 错误率
- 活跃交易数

## 安全建议

1. 永远不要在代码中硬编码私钥
2. 使用环境变量存储敏感信息
3. 设置合理的滑点容忍度
4. 总是先估算交易后再执行
5. 监控交易状态避免丢失

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT
