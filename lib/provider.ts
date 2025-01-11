import { Provider } from "starknet";
import { RPC_CONFIG, NETWORK_CONFIG } from "./config";

class StarknetProvider {
  private static instance: StarknetProvider;
  private currentEndpointIndex: number = 0;
  private provider: Provider;

  private constructor() {
    this.provider = new Provider({
      sequencer: { network: NETWORK_CONFIG.CHAIN_ID }
    });
    this.setEndpoint(RPC_CONFIG.ENDPOINTS[0]);
  }

  public static getInstance(): StarknetProvider {
    if (!StarknetProvider.instance) {
      StarknetProvider.instance = new StarknetProvider();
    }
    return StarknetProvider.instance;
  }

  public getProvider(): Provider {
    return this.provider;
  }

  private setEndpoint(endpoint: string) {
    this.provider.baseUrl = endpoint;
  }

  private switchToNextEndpoint() {
    this.currentEndpointIndex = (this.currentEndpointIndex + 1) % RPC_CONFIG.ENDPOINTS.length;
    this.setEndpoint(RPC_CONFIG.ENDPOINTS[this.currentEndpointIndex]);
  }

  public async callWithRetry<T>(
    operation: () => Promise<T>,
    retries: number = RPC_CONFIG.MAX_RETRIES
  ): Promise<T> {
    try {
      return await Promise.race([
        operation(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Timeout")), RPC_CONFIG.TIMEOUT)
        )
      ]) as T;
    } catch (error) {
      if (retries > 0) {
        console.warn(`RPC call failed, retrying... (${retries} attempts left)`);
        this.switchToNextEndpoint();
        await new Promise(resolve => setTimeout(resolve, RPC_CONFIG.RETRY_DELAY));
        return this.callWithRetry(operation, retries - 1);
      }
      throw error;
    }
  }
}

export const provider = StarknetProvider.getInstance();
