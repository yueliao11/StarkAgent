import { useState, useEffect } from 'react';
import { Provider, Account } from 'starknet';
import { useRouter, usePathname } from 'next/navigation';
import { useWalletStore } from '@/lib/store';

export const useWallet = () => {
    const [account, setAccount] = useState<Account | null>(null);
    const [provider, setProvider] = useState<Provider | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const router = useRouter();
    const pathname = usePathname();
    const setWalletStore = useWalletStore(state => state.setWallet);

    const updateAccount = (newAccount: Account | null) => {
        setAccount(newAccount);
        setWalletStore(newAccount);
    };

    // 检查是否在客户端
    const isClient = typeof window !== 'undefined';

    useEffect(() => {
        if (!isClient) return;
        
        // 如果已经在 dashboard 页面且有账户，不需要重新初始化
        if (pathname === '/dashboard' && account) {
            setLoading(false);
            return;
        }

        initializeWallet();
    }, [pathname]);

    const initializeWallet = async () => {
        if (!isClient) return;

        try {
            setLoading(true);
            setError(null);

            // 初始化 provider
            const provider = new Provider({
                sequencer: {
                    network: process.env.NEXT_PUBLIC_NETWORK || 'mainnet-alpha'
                }
            });
            setProvider(provider);

            // 检查是否已连接钱包
            const savedAccount = localStorage.getItem('walletAccount');
            if (savedAccount) {
                try {
                    const accountData = JSON.parse(savedAccount);
                    const account = new Account(
                        provider,
                        accountData.address,
                        accountData.privateKey
                    );
                    updateAccount(account);
                    
                    // 只有当不在 dashboard 页面时才跳转
                    if (pathname !== '/dashboard') {
                        router.push('/dashboard');
                    }
                } catch (parseError) {
                    console.error('Failed to parse saved account:', parseError);
                    localStorage.removeItem('walletAccount');
                }
            }
        } catch (err: any) {
            setError(err.message);
            console.error('Wallet initialization error:', err);
        } finally {
            setLoading(false);
        }
    };

    const connectWallet = async () => {
        if (!isClient) return;

        try {
            setLoading(true);
            setError(null);

            const starknet = await getStarknet();
            if (!starknet.isConnected) {
                await starknet.enable();
            }

            const userAccount = starknet.account;
            if (userAccount) {
                updateAccount(userAccount);
                
                // 保存账户信息
                localStorage.setItem('walletAccount', JSON.stringify({
                    address: userAccount.address,
                    privateKey: userAccount.privateKey
                }));

                // 确保不在 dashboard 页面时才跳转
                if (pathname !== '/dashboard') {
                    router.push('/dashboard');
                }
            }
        } catch (err: any) {
            setError(err.message);
            console.error('Wallet connection error:', err);
        } finally {
            setLoading(false);
        }
    };

    const disconnectWallet = () => {
        if (!isClient) return;

        updateAccount(null);
        localStorage.removeItem('walletAccount');
        router.push('/');
    };

    return {
        account,
        provider,
        loading,
        error,
        connectWallet,
        disconnectWallet
    };
};
