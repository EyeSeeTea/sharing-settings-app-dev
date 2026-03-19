import { Future, FutureData } from "../../domain/entities/Future";

export class InmemoryCache {
    private cache: Record<string, unknown> = {};

    getKeys(): string[] {
        return Object.keys(this.cache);
    }

    get<T>(cacheKey: string): T {
        return this.cache[cacheKey] as T;
    }

    getOrFuture<T>(cacheKey: string, future: FutureData<T>): FutureData<T> {
        if (this.cache[cacheKey] !== undefined) {
            return Future.success(this.cache[cacheKey] as T);
        }

        return future.map(response => {
            this.cache[cacheKey] = response;
            return response;
        });
    }

    clear(): void {
        this.cache = {};
    }
}
