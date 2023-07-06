import { ErrorMap } from "./errors.types"
import { authErrorMap } from "./auth.errors"
import { computeErrorMap } from "./compute.errors"
import { databaseErrorMap } from "./database.errors"
import { validationErrorMap } from "./validation.errors"

export enum UtilError {
	DefaultError = 0
}

const errorMap: ErrorMap<UtilError> = {
	[UtilError.DefaultError]: [500, "Internal server error"],
}

const mapList: [ErrorMap<any>, number][] = [
	[errorMap, 0],
	[authErrorMap, 1000],
	[validationErrorMap, 2000],
	[databaseErrorMap, 3000],
	[computeErrorMap, 20000]
]

export const getErrorData = (errorCode: number): [number, string] => {
	let data: [number, string] | undefined = undefined
	mapList.forEach(([errMap, minNum]) => {
		if (errorCode >= minNum) data = errMap[errorCode as any] || UtilError.DefaultError
	})

	return data || errorMap[UtilError.DefaultError]
}