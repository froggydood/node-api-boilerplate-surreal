import { ErrorMap } from "./errors.types"

export enum ComputeError {
	HashFailed = 20000,
}

export const computeErrorMap: ErrorMap<ComputeError> = {
	[ComputeError.HashFailed]: [500, "Hash failed"]
}