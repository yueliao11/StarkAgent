import { Provider } from "starknet";
import { Cache } from "../utils/cache";
import { DexService } from "./dexService";
import { PriceService } from "./priceService";
import { MonitoringService } from "./monitoringService";
import { TransactionManager } from "./transactionManager";

export class ServiceContainer {
    private static instance: ServiceContainer;
    private services: Map<string, any>;

    private constructor(
        private readonly provider: Provider,
        private readonly cache: Cache
    ) {
        this.services = new Map();
    }

    public static getInstance(provider: Provider, cache: Cache): ServiceContainer {
        if (!ServiceContainer.instance) {
            ServiceContainer.instance = new ServiceContainer(provider, cache);
        }
        return ServiceContainer.instance;
    }

    public getService<T>(serviceClass: new (...args: any[]) => T): T {
        const serviceName = serviceClass.name;
        
        if (!this.services.has(serviceName)) {
            const service = new serviceClass(this.provider, this.cache, this);
            this.services.set(serviceName, service);
        }
        
        return this.services.get(serviceName);
    }
}
