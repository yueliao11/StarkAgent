export const RPC_CONFIG = {
  ENDPOINTS: [
    "https://starknet-mainnet.public.blastapi.io",
    "https://rpc.starknet.lava.build",
    "https://starknet-mainnet.infura.io/v3/your-api-key", // 需要替换为实际的 API key
    "https://starknet-mainnet.g.alchemy.com/v2/your-api-key", // 需要替换为实际的 API key
  ],
  TIMEOUT: 5000, // 5 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
};

export const NETWORK_CONFIG = {
  CHAIN_ID: "SN_MAIN",
  DEFAULT_PROVIDER_URL: RPC_CONFIG.ENDPOINTS[0],
};
