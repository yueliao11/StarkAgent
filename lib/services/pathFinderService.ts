import { Provider, Contract } from "starknet";
import { PriceService } from "./priceService";
import { BaseService } from "./baseService";
import { SwapPath, PoolInfo } from "../types/dex";
import { CONTRACTS } from "../constants";

interface Graph {
  [key: string]: {
    [key: string]: {
      pool: PoolInfo;
      weight: number;
    }[];
  };
}

interface PathNode {
  token: string;
  poolAddress: string;
  nextToken: string;
  amount: bigint;
  fee: number;
}

export class PathFinderService extends BaseService {
  private static instance: PathFinderService;
  private graph: Graph = {};
  private priceService: PriceService;

  private constructor(provider: Provider) {
    super(provider);
    this.priceService = PriceService.getInstance(provider);
  }

  public static getInstance(provider: Provider): PathFinderService {
    if (!PathFinderService.instance) {
      PathFinderService.instance = new PathFinderService(provider);
    }
    return PathFinderService.instance;
  }

  private async getPoolInfo(poolAddress: string): Promise<PoolInfo> {
    const cacheKey = `pool_info_${poolAddress}`;
    
    return this.cache.getOrFetch(
      cacheKey,
      async () => {
        const poolContract = new Contract(
          [
            {
              name: "getReserves",
              type: "function",
              inputs: [],
              outputs: [{ name: "reserve0", type: "felt" }, { name: "reserve1", type: "felt" }]
            }
          ],
          poolAddress,
          this.provider
        );

        const [reserve0, reserve1] = await poolContract.getReserves();
        
        return {
          address: poolAddress,
          token0: "", // Will be filled by the caller
          token1: "", // Will be filled by the caller
          reserve0: BigInt(reserve0),
          reserve1: BigInt(reserve1),
          fee: 0.003, // Default fee, should be fetched from contract
          lastUpdateTime: Date.now()
        };
      },
      60000 // 1 minute cache
    );
  }

  public async findBestPath(
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    maxHops: number = 3
  ): Promise<SwapPath> {
    await this.updateGraph();
    
    const paths = await this.findAllPaths(tokenIn, tokenOut, maxHops);
    let bestPath: SwapPath | null = null;
    let maxOutput = 0n;

    for (const path of paths) {
      const { amounts, fees } = await this.simulatePath(path, amountIn);
      const output = amounts[amounts.length - 1];
      
      if (output > maxOutput) {
        maxOutput = output;
        bestPath = {
          pools: path.map(node => node.poolAddress),
          tokens: [tokenIn, ...path.map(node => node.nextToken)],
          fees: fees,
          amounts: amounts,
          expectedOutput: output,
          priceImpact: await this.calculatePriceImpact(amounts, path)
        };
      }
    }

    if (!bestPath) {
      throw new Error(`No valid path found from ${tokenIn} to ${tokenOut}`);
    }

    return bestPath;
  }

  private async updateGraph(): Promise<void> {
    const cacheKey = "liquidity_graph";
    const cachedGraph = this.cache.get<Graph>(cacheKey);
    
    if (cachedGraph) {
      this.graph = cachedGraph;
      return;
    }

    // 从 DEX 获取所有池信息并构建图
    await this.buildGraph();
    
    // 缓存图数据
    this.cache.set(cacheKey, this.graph, 30000); // 30秒缓存
  }

  private async buildGraph(): Promise<void> {
    // TODO: 从 DEX 工厂合约获取所有池
    const pools: PoolInfo[] = await this.getAllPools();

    // 构建图
    for (const pool of pools) {
      this.addPoolToGraph(pool);
    }
  }

  private addPoolToGraph(pool: PoolInfo): void {
    // 添加正向边
    if (!this.graph[pool.token0]) {
      this.graph[pool.token0] = {};
    }
    if (!this.graph[pool.token0][pool.token1]) {
      this.graph[pool.token0][pool.token1] = [];
    }
    
    // 添加反向边
    if (!this.graph[pool.token1]) {
      this.graph[pool.token1] = {};
    }
    if (!this.graph[pool.token1][pool.token0]) {
      this.graph[pool.token1][pool.token0] = [];
    }

    // 计算池的权重（基于流动性和费用）
    const weight = this.calculatePoolWeight(pool);

    // 添加双向边
    this.graph[pool.token0][pool.token1].push({
      pool,
      weight
    });
    this.graph[pool.token1][pool.token0].push({
      pool,
      weight
    });
  }

  private calculatePoolWeight(pool: PoolInfo): number {
    // 权重计算考虑:
    // 1. 流动性大小
    // 2. 费用率
    // 3. 价格影响
    const liquidity = Number(pool.reserve0) * Number(pool.reserve1);
    const feeMultiplier = 1 - pool.fee;
    return Math.log(liquidity) * feeMultiplier;
  }

  private async findAllPaths(
    tokenIn: string,
    tokenOut: string,
    maxHops: number
  ): Promise<PathNode[][]> {
    const paths: PathNode[][] = [];
    const visited = new Set<string>();
    
    const dfs = (
      currentToken: string,
      targetToken: string,
      currentPath: PathNode[],
      remainingHops: number
    ) => {
      if (currentToken === targetToken && currentPath.length > 0) {
        paths.push([...currentPath]);
        return;
      }

      if (remainingHops === 0 || !this.graph[currentToken]) {
        return;
      }

      visited.add(currentToken);

      for (const nextToken of Object.keys(this.graph[currentToken])) {
        if (!visited.has(nextToken)) {
          for (const { pool } of this.graph[currentToken][nextToken]) {
            currentPath.push({
              token: currentToken,
              poolAddress: pool.address,
              nextToken,
              amount: BigInt(0), // Will be calculated later
              fee: pool.fee
            });
            dfs(nextToken, targetToken, currentPath, remainingHops - 1);
            currentPath.pop();
          }
        }
      }

      visited.delete(currentToken);
    };

    dfs(tokenIn, tokenOut, [], maxHops);
    return paths;
  }

  private async simulatePath(
    path: PathNode[],
    amountIn: bigint
  ): Promise<{ amounts: bigint[]; fees: number[] }> {
    let currentAmount = amountIn;
    const amounts: bigint[] = [currentAmount];
    const fees: number[] = [];

    // 计算每一跳的输出金额
    for (let i = 0; i < path.length; i++) {
      const node = path[i];
      const pool = await this.getPoolInfo(node.poolAddress);
      
      // 计算这一跳的输出和价格影响
      const [outputAmount, impact] = this.calculateSwapOutput(
        currentAmount,
        pool,
        node.token === pool.token0
      );

      currentAmount = outputAmount;
      amounts.push(currentAmount);
      fees.push(impact);

      // 更新路径节点的金额
      path[i].amount = currentAmount;
    }

    return { amounts, fees };
  }

  private calculateSwapOutput(
    amountIn: bigint,
    pool: PoolInfo,
    isToken0: boolean
  ): [bigint, number] {
    const inputReserve = isToken0 ? pool.reserve0 : pool.reserve1;
    const outputReserve = isToken0 ? pool.reserve1 : pool.reserve0;

    // 计算价格影响
    const priceImpact = Number(amountIn * BigInt(10000) / inputReserve) / 100;

    // 计算输出金额（考虑费用）
    const amountInWithFee = amountIn * BigInt(1000 - Math.floor(pool.fee * 1000)) / BigInt(1000);
    const numerator = amountInWithFee * outputReserve;
    const denominator = inputReserve + amountInWithFee;
    const amountOut = numerator / denominator;

    return [amountOut, priceImpact];
  }

  private async calculatePriceImpact(
    amounts: bigint[],
    path: PathNode[]
  ): Promise<number> {
    let priceImpact = 0;

    for (let i = 0; i < amounts.length - 1; i++) {
      const amountIn = amounts[i];
      const amountOut = amounts[i + 1];
      const node = path[i];
      const pool = await this.getPoolInfo(node.poolAddress);

      // 计算价格影响
      const impact = this.calculateSwapOutput(
        amountIn,
        pool,
        node.token === pool.token0
      )[1];

      priceImpact += impact;
    }

    return priceImpact;
  }

  private async getAllPools(): Promise<PoolInfo[]> {
    // TODO: 实现从 DEX 工厂获取所有池
    // 这应该:
    // 1. 调用工厂合约获取池列表
    // 2. 并行获取池信息
    // 3. 过滤掉无效池
    return [];
  }
}
