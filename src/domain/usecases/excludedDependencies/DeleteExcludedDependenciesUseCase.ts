import { UseCase } from "../../../CompositionRoot";
import { GlobalExcludedDependenciesRepository } from "../../repositories/GlobalExcludedDependenciesRepository";
import { FutureData } from "../../../domain/entities/Future";
import { Id } from "../../entities/Ref";

export class DeleteExcludedDependenciesUseCase implements UseCase {
    constructor(private globalExcludedDependenciesRepository: GlobalExcludedDependenciesRepository) {}

    public execute(id: Id): FutureData<void> {
        return this.globalExcludedDependenciesRepository.delete(id);
    }
}
