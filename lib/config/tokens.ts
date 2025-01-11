export interface Token {
    address: string;
    symbol: string;
    decimals: number;
    name: string;
    logoURI?: string;
}

export const TOKENS = {
    ETH: {
        address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
        symbol: 'ETH',
        decimals: 18,
        name: 'Ether',
        logoURI: 'https://tokens.1inch.io/0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7.png'
    },
    USDC: {
        address: '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8',
        symbol: 'USDC',
        decimals: 6,
        name: 'USD Coin',
        logoURI: 'https://tokens.1inch.io/0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8.png'
    },
    DAI: {
        address: '0x00da114221cb83fa859dbdb4c44beeaa0bb37c7537ad5ae66fe5e0efd20e6eb3',
        symbol: 'DAI',
        decimals: 18,
        name: 'Dai Stablecoin',
        logoURI: 'https://tokens.1inch.io/0x00da114221cb83fa859dbdb4c44beeaa0bb37c7537ad5ae66fe5e0efd20e6eb3.png'
    },
    USDT: {
        address: '0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8',
        symbol: 'USDT',
        decimals: 6,
        name: 'Tether USD',
        logoURI: 'https://tokens.1inch.io/0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8.png'
    }
} as const;
