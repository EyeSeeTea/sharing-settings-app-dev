import { Instance } from "../entities/Instance";
import { InstanceDefaultRepository } from "./InstanceDefaultRepository";
import { GlobalExcludedDependenciesRepository } from "../../domain/repositories/GlobalExcludedDependenciesRepository";
import { DataStoreStorageClient } from "../clients/storage/DataStoreStorageClient";
import { Namespaces } from "../clients/storage/Namespaces";
import { StorageClient } from "../clients/storage/StorageClient";
import { Ref } from "../../domain/entities/Ref";
import { FutureData } from "../../domain/entities/Future";

export class GlobalExcludedDependenciesD2ApiRepository implements GlobalExcludedDependenciesRepository {
    private storageClient: StorageClient;

    constructor(instance: Instance, private instanceRepository: InstanceDefaultRepository) {
        this.storageClient = new DataStoreStorageClient(instance);
    }

    public list(): FutureData<Ref[]> {
        //I don't know if I need to save the excluded Dependencies based on the user
            //const currentUser = this.instanceRepository.getCurrentUser();
            const excludedDependencies = this.storageClient.listObjectsInCollection<Ref>(
                Namespaces.EXCLUDED_DEPENDENCIES
            );

            return excludedDependencies;
    }

    public save(excludedDependencies: string[]): FutureData<void> {
        //I need to compare the excludedDependencies and call remove on the ones that aren't there
        const properFormat = excludedDependencies.map(dependency => ({id: dependency}));

        /*const currentDependencies = this.storageClient.listObjectsInCollection<Ref>(
            Namespaces.EXCLUDED_DEPENDENCIES
        ).run(
            data => {
                return data.filter(item => !properFormat.some(element => item.id === element.id));
            },
            error => console.error(error)
        );*/
       // console.log(currentDependencies);
        return this.storageClient.saveObjectsInCollection<Ref>(
            Namespaces.EXCLUDED_DEPENDENCIES,
            properFormat
        );
    }

}
