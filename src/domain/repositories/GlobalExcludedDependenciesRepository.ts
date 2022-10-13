import { FutureData } from "../../domain/entities/Future";
import { Id, Ref } from "../../domain/entities/Ref";

export interface GlobalExcludedDependenciesRepository {
    list(): FutureData<Ref[]>;
    save(excludedDependencies: string[]): FutureData<void>;
    delete(id: Id): FutureData<void>;
}
