import { Contract, Provider, Account } from "starknet";
import { CONTRACTS } from "./constants";
import { provider } from "./provider";

export async function getTokenBalance(
  rpcProvider: Provider,
  tokenAddress: string,
  accountAddress: string
): Promise<bigint> {
  const erc20ABI = [
    {
      name: "balanceOf",
      type: "function",
      inputs: [{ name: "account", type: "felt" }],
      outputs: [{ name: "balance", type: "felt" }],
      stateMutability: "view"
    }
  ];

  try {
    const contract = new Contract(
      erc20ABI,
      tokenAddress,
      rpcProvider,
      "1" // Cairo 1 version
    );
    
    const response = await provider.callWithRetry(async () => {
      const result = await contract.balanceOf(accountAddress);
      return result;
    });
    
    // 处理不同格式的返回值
    if (typeof response === 'string' || typeof response === 'number') {
      return BigInt(response);
    } else if (response && typeof response === 'object') {
      const balance = response.balance || response[0] || '0';
      return BigInt(balance.toString());
    }
    
    return BigInt(0);
  } catch (error) {
    console.error("Error fetching token balance:", error);
    return BigInt(0);
  }
}

export async function getTokenAllowance(
  rpcProvider: Provider,
  tokenAddress: string,
  ownerAddress: string,
  spenderAddress: string
): Promise<bigint> {
  const erc20ABI = [
    {
      name: "allowance",
      type: "function",
      inputs: [
        { name: "owner", type: "felt" },
        { name: "spender", type: "felt" }
      ],
      outputs: [{ name: "remaining", type: "felt" }],
      stateMutability: "view"
    }
  ];

  try {
    const contract = new Contract(
      erc20ABI,
      tokenAddress,
      rpcProvider,
      "1"
    );
    
    const response = await provider.callWithRetry(async () => {
      const result = await contract.allowance(ownerAddress, spenderAddress);
      return result;
    });

    if (typeof response === 'string' || typeof response === 'number') {
      return BigInt(response);
    } else if (response && typeof response === 'object') {
      const allowance = response.remaining || response[0] || '0';
      return BigInt(allowance.toString());
    }

    return BigInt(0);
  } catch (error) {
    console.error("Error fetching token allowance:", error);
    return BigInt(0);
  }
}

export async function executeSwap(
  account: Account,
  params: {
    dex: "ekubo" | "avnu";
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    minAmountOut: string;
  }
) {
  const routerABI = [
    {
      name: "swap",
      type: "function",
      inputs: [
        { name: "token_in", type: "felt" },
        { name: "token_out", type: "felt" },
        { name: "amount_in", type: "felt" },
        { name: "min_amount_out", type: "felt" },
        { name: "recipient", type: "felt" }
      ],
      outputs: [],
      stateMutability: "external"
    }
  ];

  const routerAddress = params.dex === "ekubo" 
    ? CONTRACTS.EKUBO.ROUTER 
    : CONTRACTS.AVNU.ROUTER;

  try {
    const router = new Contract(
      routerABI,
      routerAddress,
      account,
      "1"
    );

    return await provider.callWithRetry(async () => {
      return router.swap(
        params.tokenIn,
        params.tokenOut,
        params.amountIn,
        params.minAmountOut,
        account.address
      );
    });
  } catch (error) {
    console.error("Error executing swap:", error);
    throw error;
  }
}