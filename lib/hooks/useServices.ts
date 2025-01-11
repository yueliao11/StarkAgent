import { useMemo } from 'react';
import { Provider } from 'starknet';
import { Cache } from '../utils/cache';
import { ServiceContainer } from '../services/serviceContainer';

export function useServices(provider: Provider) {
    return useMemo(() => {
        const cache = Cache.getInstance();
        return ServiceContainer.getInstance(provider, cache);
    }, [provider]);
}
