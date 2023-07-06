import { getErrorData, UtilError } from "../errors/error"

export type ErrorMap<T extends number> = Record<T, [number, string]>

export class HTTPError {
	baseClass: string
	statusCode: number
	message: string
	baseMessage: string
	errorCode: number
	data: Record<string, any> | undefined

	constructor(errorCode?: number, message?: string, data?: Record<string, any>) {
		if (errorCode === undefined) errorCode = UtilError.DefaultError

		const [ httpStatusCode, errorMessage ] = getErrorData(errorCode)
		
		this.baseClass = "HTTPError"
		this.statusCode = httpStatusCode
		this.message = message || errorMessage
		this.baseMessage = errorMessage
		this.errorCode = errorCode
		this.data = data
	}
}