import { Provider } from "starknet";
import { Cache } from "../utils/cache";
import { ServiceContainer } from "./serviceContainer";

export class BaseService {
    protected provider: Provider;
    protected cache: Cache;
    protected container: ServiceContainer;

    protected constructor(provider: Provider, cache: Cache, container: ServiceContainer) {
        this.provider = provider;
        this.cache = cache;
        this.container = container;
    }
}
