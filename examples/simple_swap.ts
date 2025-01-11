import { Provider, Account } from "starknet";
import { DexService } from "../lib/services/dexService";
import { TOKENS } from "../config/tokens";

async function simpleSwap() {
    // 1. 设置 Provider
    const provider = new Provider({
        sequencer: {
            network: "mainnet-alpha"
        }
    });

    // 2. 设置账户
    const account = new Account(
        provider,
        process.env.ACCOUNT_ADDRESS!,
        process.env.PRIVATE_KEY!
    );

    // 3. 初始化 DEX 服务
    const dexService = DexService.getInstance(provider);

    // 4. 准备交易参数
    const swapParams = {
        tokenIn: TOKENS.ETH.address,
        tokenOut: TOKENS.USDC.address,
        amountIn: "1000000000000000000", // 1 ETH
        slippageTolerance: 0.005, // 0.5%
        deadline: 300 // 5 minutes
    };

    try {
        // 5. 获取交易估算
        console.log("Estimating swap...");
        const estimate = await dexService.estimateSwap(swapParams);
        
        console.log("Swap estimate:");
        console.log(`Expected output: ${estimate.expectedOutput} USDC`);
        console.log(`Minimum output: ${estimate.minimumOutput} USDC`);
        console.log(`Price impact: ${estimate.priceImpact}%`);
        console.log(`Gas estimate: ${estimate.gasEstimate} wei`);

        // 6. 确认交易
        const proceed = await confirmTransaction(estimate);
        if (!proceed) {
            console.log("Transaction cancelled");
            return;
        }

        // 7. 执行交易
        console.log("Executing swap...");
        const txHash = await dexService.executeSwap(account, swapParams);
        console.log(`Transaction submitted: ${txHash}`);

        // 8. 监听交易完成
        dexService.on("swapCompleted", (data) => {
            if (data.txHash === txHash) {
                console.log("\nSwap completed successfully!");
                console.log("Transaction analytics:");
                console.log(`- Execution time: ${data.analytics.executionTime}ms`);
                console.log(`- Gas used: ${data.analytics.gasCost}`);
                console.log(`- Route: ${data.analytics.route.join(" -> ")}`);
                process.exit(0);
            }
        });

    } catch (error) {
        console.error("Error during swap:", error);
        process.exit(1);
    }
}

// 辅助函数：确认交易
async function confirmTransaction(estimate: any): Promise<boolean> {
    console.log("\nPlease confirm the transaction:");
    console.log(`- You will swap 1 ETH for at least ${estimate.minimumOutput} USDC`);
    console.log(`- Price impact: ${estimate.priceImpact}%`);
    console.log(`- Estimated gas cost: ${estimate.gasEstimate} wei`);
    
    // 在实际应用中，这里应该等待用户输入确认
    return true;
}

// 检查环境变量
if (!process.env.ACCOUNT_ADDRESS || !process.env.PRIVATE_KEY) {
    console.error("Please set ACCOUNT_ADDRESS and PRIVATE_KEY environment variables");
    process.exit(1);
}

// 运行示例
console.log("Starting simple swap example...");
simpleSwap().catch(console.error);
