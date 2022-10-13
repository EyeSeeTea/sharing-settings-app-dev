import { Instance } from "../entities/Instance";
import { GlobalExcludedDependenciesRepository } from "../../domain/repositories/GlobalExcludedDependenciesRepository";
import { DataStoreStorageClient } from "../clients/storage/DataStoreStorageClient";
import { Namespaces } from "../clients/storage/Namespaces";
import { StorageClient } from "../clients/storage/StorageClient";
import { Id, Ref } from "../../domain/entities/Ref";
import { FutureData } from "../../domain/entities/Future";

export class GlobalExcludedDependenciesD2ApiRepository implements GlobalExcludedDependenciesRepository {
    private storageClient: StorageClient;

    constructor(instance: Instance) {
        this.storageClient = new DataStoreStorageClient(instance);
    }

    public list(): FutureData<Ref[]> {
        const excludedDependencies = this.storageClient.listObjectsInCollection<Ref>(Namespaces.EXCLUDED_DEPENDENCIES);

        return excludedDependencies;
    }

    public save(excludedDependencies: string[]): FutureData<void> {
        const properFormat = excludedDependencies.map(dependency => ({ id: dependency }));

        return this.storageClient.saveObjectsInCollection<Ref>(Namespaces.EXCLUDED_DEPENDENCIES, properFormat);
    }

    public delete(id: Id): FutureData<void> {
        return this.storageClient.removeObjectInCollection(Namespaces.EXCLUDED_DEPENDENCIES, id);
    }
}
