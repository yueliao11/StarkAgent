import { Provider, Account } from "starknet";
import { DexService } from "../lib/services/dexService";
import { MonitoringService } from "../lib/services/monitoringService";
import { PriceAlert, PriceAlertCondition, TradeStatus } from "../lib/types/dex";

async function main() {
    // 初始化 Provider
    const provider = new Provider({
        sequencer: {
            network: "mainnet-alpha" // 或者 "testnet-alpha"
        }
    });

    // 初始化服务
    const dexService = DexService.getInstance(provider);
    const monitoring = MonitoringService.getInstance(provider);

    // 设置账户（这里需要你的私钥）
    const account = new Account(
        provider,
        "YOUR_ACCOUNT_ADDRESS",
        "YOUR_PRIVATE_KEY"
    );

    // 1. 设置价格警报
    const priceAlert: PriceAlert = {
        tokenAddress: "ETH_TOKEN_ADDRESS",
        condition: PriceAlertCondition.ABOVE,
        targetPrice: 2000, // 当 ETH 价格超过 2000 时触发
        callback: async (price) => {
            console.log(`Price alert triggered! ETH price: ${price.currentPrice}`);
            
            // 执行交易
            try {
                const txHash = await executeSwap();
                console.log(`Swap initiated: ${txHash}`);
            } catch (error) {
                console.error("Swap failed:", error);
            }
        }
    };

    const alertId = await monitoring.addPriceAlert(priceAlert);
    console.log(`Price alert set with ID: ${alertId}`);

    // 2. 执行交易
    async function executeSwap() {
        // 交易参数
        const swapParams = {
            tokenIn: "ETH_TOKEN_ADDRESS",
            tokenOut: "USDC_TOKEN_ADDRESS",
            amountIn: "1000000000000000000", // 1 ETH (18 decimals)
            slippageTolerance: 0.005, // 0.5%
            deadline: 300 // 5 minutes
        };

        try {
            // 获取交易估算
            const estimate = await dexService.estimateSwap(swapParams);
            console.log("Swap estimate:", {
                expectedOutput: estimate.expectedOutput.toString(),
                priceImpact: estimate.priceImpact,
                minimumOutput: estimate.minimumOutput.toString(),
                gasEstimate: estimate.gasEstimate.toString()
            });

            // 执行交易
            const txHash = await dexService.executeSwap(account, swapParams);
            console.log(`Transaction submitted: ${txHash}`);

            // 监听交易状态
            dexService.on("swapCompleted", async (data) => {
                if (data.txHash === txHash) {
                    console.log("Swap completed!");
                    console.log("Analytics:", data.analytics);
                    console.log("Trading metrics:", data.metrics);
                }
            });

            return txHash;
        } catch (error) {
            console.error("Error executing swap:", error);
            throw error;
        }
    }

    // 3. 监控系统指标
    monitoring.on("metricsCollected", (metrics) => {
        console.log("System metrics:", {
            cacheHitRate: metrics.cacheHitRate,
            apiLatency: metrics.apiLatency,
            errorRate: metrics.errorRate,
            activeTransactions: metrics.activeTransactions
        });
    });

    // 4. 获取交易统计
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const tradingMetrics = await monitoring.getTradingMetrics(dayAgo, now);
    console.log("24h Trading metrics:", {
        successRate: tradingMetrics.successRate,
        averageSlippage: tradingMetrics.averageSlippage,
        totalTrades: tradingMetrics.totalTrades,
        totalVolume: tradingMetrics.totalVolume,
        bestRoute: tradingMetrics.bestRoute
    });
}

// 运行示例
main().catch(console.error);
