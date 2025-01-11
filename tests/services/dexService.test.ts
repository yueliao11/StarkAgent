import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Account, Contract, Provider } from 'starknet';
import { DexService } from '../../lib/services/dexService';
import { ServiceContainer } from '../../lib/services/serviceContainer';
import { Cache } from '../../lib/utils/cache';
import { CONTRACTS, EVENTS } from '../../lib/constants';
import { SwapParams, TradeStatus } from '../../lib/types/dex';

// Mock starknet provider and contracts
jest.mock('starknet');

describe('DexService', () => {
  let dexService: DexService;
  let provider: jest.Mocked<Provider>;
  let mockContract: jest.Mocked<Contract>;

  beforeEach(() => {
    // Setup mocks
    provider = new Provider() as jest.Mocked<Provider>;
    const cache = Cache.getInstance();
    const container = ServiceContainer.getInstance(provider, cache);
    
    // Mock Contract constructor
    mockContract = {
      get_amounts_out: jest.fn(),
      get_reserves: jest.fn(),
      get_fee: jest.fn(),
      get_tokens: jest.fn(),
      swap: jest.fn(),
    } as unknown as jest.Mocked<Contract>;
    
    (Contract as jest.Mock).mockImplementation(() => mockContract);

    // Initialize service
    dexService = DexService.getInstance(provider, cache, container);
  });

  describe('findBestSwapPath', () => {
    const swapParams: SwapParams = {
      tokenIn: CONTRACTS.TOKENS.ETH,
      tokenOut: CONTRACTS.TOKENS.USDC,
      amountIn: "1000000000000000000", // 1 ETH
      slippageTolerance: 0.005
    };

    it('should find best path on Ekubo', async () => {
      // Mock contract response
      mockContract.get_amounts_out.mockResolvedValue({
        amount_out: "1000000", // 1 USDC
        price_impact: "100" // 1%
      });

      const path = await dexService.findBestSwapPath(swapParams);

      expect(path).toBeDefined();
      expect(path.tokens).toEqual([swapParams.tokenIn, swapParams.tokenOut]);
      expect(path.pools).toEqual([CONTRACTS.EKUBO.ROUTER]);
      expect(path.expectedOutput).toBe(BigInt("1000000"));
      expect(path.priceImpact).toBe(0.01); // 1%
    });

    it('should throw error when no path found', async () => {
      // Mock contract failure
      mockContract.get_amounts_out.mockRejectedValue(new Error('No path found'));

      await expect(dexService.findBestSwapPath(swapParams))
        .rejects
        .toThrow('Failed to find best swap path');
    });
  });

  describe('executeSwap', () => {
    const account = {} as Account;
    const swapParams: SwapParams = {
      tokenIn: CONTRACTS.TOKENS.ETH,
      tokenOut: CONTRACTS.TOKENS.USDC,
      amountIn: "1000000000000000000",
      slippageTolerance: 0.005
    };

    it('should execute swap successfully', async () => {
      // Mock contract responses
      mockContract.get_amounts_out.mockResolvedValue({
        amount_out: "1000000",
        price_impact: "100"
      });

      mockContract.swap.mockResolvedValue({
        transaction_hash: "0x123"
      });

      // Setup event listener
      const swapCompletedPromise = new Promise((resolve) => {
        dexService.on(EVENTS.SWAP_COMPLETED, resolve);
      });

      // Execute swap
      const txHash = await dexService.executeSwap(account, swapParams);

      expect(txHash).toBe("0x123");

      // Verify event was emitted
      const eventData = await swapCompletedPromise;
      expect(eventData).toMatchObject({
        txHash: "0x123",
        analytics: {
          status: TradeStatus.COMPLETED,
          tokenIn: swapParams.tokenIn,
          tokenOut: swapParams.tokenOut,
        }
      });
    });

    it('should handle swap failure', async () => {
      // Mock contract failure
      mockContract.get_amounts_out.mockRejectedValue(new Error('No path found'));

      // Setup event listener
      const swapFailedPromise = new Promise((resolve) => {
        dexService.on(EVENTS.SWAP_FAILED, resolve);
      });

      // Execute swap and expect failure
      await expect(dexService.executeSwap(account, swapParams))
        .rejects
        .toThrow('Failed to find best swap path');

      // Verify event was emitted
      const eventData = await swapFailedPromise;
      expect(eventData).toMatchObject({
        error: expect.any(Error),
        params: swapParams
      });
    }, 10000); // 增加超时时间到 10 秒
  });

  describe('getPoolInfo', () => {
    const poolAddress = "pool_address";

    it('should get pool info successfully', async () => {
      // Mock contract responses
      mockContract.get_reserves.mockResolvedValue({
        reserve0: "1000000",
        reserve1: "2000000"
      });
      mockContract.get_fee.mockResolvedValue("300"); // 0.3%
      mockContract.get_tokens.mockResolvedValue({
        token0: CONTRACTS.TOKENS.ETH,
        token1: CONTRACTS.TOKENS.USDC
      });

      const poolInfo = await dexService.getPoolInfo(poolAddress);

      expect(poolInfo).toMatchObject({
        reserve0: "1000000",
        reserve1: "2000000",
        fee: "300",
        token0: CONTRACTS.TOKENS.ETH,
        token1: CONTRACTS.TOKENS.USDC,
        address: poolAddress
      });
    });

    it('should handle pool info fetch failure', async () => {
      // Mock contract failure
      mockContract.get_reserves.mockRejectedValue(new Error('Failed to get reserves'));

      await expect(dexService.getPoolInfo(poolAddress))
        .rejects
        .toThrow('Failed to get pool info');
    });
  });
});
