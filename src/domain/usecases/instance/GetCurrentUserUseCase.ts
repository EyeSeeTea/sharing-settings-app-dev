import { UseCase } from "../../../CompositionRoot";
import { FutureData } from "../../entities/Future";
import { User } from "../../entities/User";
import { InstanceRepository } from "../../repositories/InstanceRepository";

export class GetCurrentUserUseCase implements UseCase {
    constructor(private instanceRepository: InstanceRepository) {}

    public execute(): FutureData<User> {
        return this.instanceRepository.getCurrentUser();
    }
}
