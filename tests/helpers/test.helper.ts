import axios, { AxiosError, AxiosResponse } from "axios"
import { AuthError } from "../../src/errors"
import { API, DB } from "../../src/types"
import { wait } from "./promise.helper"
import { createToken, catchErrors } from "../../src/helpers"
import { TokenData } from "./token.helper"

export const apiErrorTest = async <T>(
	promise: Promise<AxiosResponse<T>>,
	errorCode: number
) => {
	const {
		success,
		error: errorRes
	} = await catchErrors<AxiosResponse<T>, AxiosError<API.Error>>(promise)

	expect(success).toBe(false)

	if (!errorRes) {
		throw "No error response given"
	}
	expectError(errorRes, errorCode)
}

export const expectError = (errRes: AxiosError<API.Error>, errorCode: number) => {
	const error = errRes?.response?.data.error
	expect(error).toBeTruthy()
	expect(error?.errorCode).toEqual(errorCode)
}

export const checkObjMatch = (
	data: any,
	matchArgs: Record<string, any>
) => {
	if (typeof(data) !== "object") return expect(data).toBe(matchArgs)

	const matchArgsWithoutRegexp = Object.entries(matchArgs)
		.filter(([key, value]) => !(value instanceof RegExp))
		.reduce((acc, [key, value]) => ({...acc, [key]: value}), {} as Record<string, any>)

	expect(data).toMatchObject(matchArgsWithoutRegexp)
	
	Object.entries(matchArgs)
		.filter(([key, value]) => (value instanceof RegExp))
		.forEach(([key, regexp]) => {
			let newValue: unknown = data[key]
			if (typeof(newValue) === "object" && typeof((newValue as Date).toISOString) === "function") newValue = (newValue as Date).toISOString()
			expect(newValue).toMatch(regexp as RegExp)
		})
	
}

export const checkObjMatchExclusive = (
	data: any,
	matchArgs: Record<string, any>
) => {
	checkObjMatch(data, matchArgs)
	expect(Object.entries(data).length).toBe(Object.entries(matchArgs).length)
	
}

export const apiSuccessTest = async <T, D, M extends Record<string, any>>(args: {
	apiPromise: Promise<AxiosResponse<T>>,
	apiDataGetter?: (res: AxiosResponse<T>) => D,
	matchArgs?: M
}): Promise<AxiosResponse<T>> => {
	const {
		success: success,
		data: res
	} = await catchErrors<AxiosResponse<T>, AxiosError<API.Error>>(args.apiPromise)

	expect(success).toBe(true)
	if (!success) throw ""
	
	expect(res.status).toBeGreaterThanOrEqual(200)
	expect(res.status).toBeLessThan(400)

	if (args.apiDataGetter && args.matchArgs) {
		const data = args.apiDataGetter(res)
		checkObjMatch(data, args.matchArgs)
	}

	return res
}

export const apiDBSuccessTest = async <T,D,M extends Record<string, any>>(args: {
	apiPromise: Promise<AxiosResponse<T>>,
	dbGetter: (apiData: T) => Promise<D>,
	expectCB?: (apiData: T) => void,
	matchArgs: Partial<M>
}): Promise<T> => {
	const {
		success: apiSuccess,
		data: res,
		error
	} = await catchErrors<AxiosResponse<T>, AxiosError<API.Error>>(args.apiPromise)

	if (error) console.error(error?.response?.data)
	expect(apiSuccess).toEqual(true)
	if (!apiSuccess) throw "Error"

	expect(res.status).toBeGreaterThanOrEqual(200)
	expect(res.status).toBeLessThan(400)

	await args.expectCB?.(res.data)

	const {
		success: dbSuccess,
		data: dbData,
		error: dbError
	} = await catchErrors(args.dbGetter(res.data))
	if (dbError) console.error(dbError)

	expect(dbSuccess).toEqual(true)

	checkObjMatch(dbData, args.matchArgs)

	return res.data
}

export const apiAuthenticationTest = async <T>(_args: {
	userId: string,
	userRole?: DB.UserRole,
	permissions?: DB.Permission[]
	apiPromise: (token: string | undefined) => Promise<AxiosResponse<T>>,
	afterAll?: () => Promise<void>,
	overridePermissions?: DB.Permission[],
	errorsWithOtherUser?: boolean
}): Promise<AxiosResponse<T>> => {
	const args = {
		errorsWithOtherUser: false,
		..._args,
	}
	await apiErrorTest(args.apiPromise(undefined), AuthError.NoToken)
	await args.afterAll?.()

	const tokenArgs: TokenData = {
		userId: args.userId,
		userRole: args.userRole || "user",
		permissions: args.permissions || [],
		tokenNumber: 0,
		type: "access"
	}

	const expiredToken = await createToken(tokenArgs, 5)
	await wait(8000)
	await apiErrorTest(args.apiPromise(expiredToken.token), AuthError.ExpiredAuthToken)
	await args.afterAll?.()

	if (args.errorsWithOtherUser) {
		const otherUserToken = await createToken({...tokenArgs, userId: "SOME_OTHER_userId"}, 10_000)
		await apiErrorTest(args.apiPromise(otherUserToken.token), AuthError.InvalidPermissions)
		await args.afterAll?.()

		if (args.overridePermissions) {
			const otherUserTokenWithOverride = await createToken({...tokenArgs, userId: "SOME_OTHER_userId", permissions: args.overridePermissions}, 10_000)
			await apiSuccessTest({
				apiPromise: args.apiPromise(otherUserTokenWithOverride.token)
			})
			await args.afterAll?.()
		}
	}

	const validToken = await createToken(tokenArgs, 10_000)

	const data = await apiSuccessTest({
		apiPromise: args.apiPromise(validToken.token)
	})
	await args.afterAll?.()
	return data

}

export const expectUrlIsValidImage = async (url: string): Promise<void> => {
	const res = await axios.get(url)
	expect(res.headers["content-type"]).toBe("image/webp")
	expect(res.status).toBe(200)
	expect(Number.parseInt(res.headers["content-length"])).toBeGreaterThan(100)
}

export const expectUrlsAreValidImages = async (urls: string[]): Promise<void> => {
	await Promise.allSettled(urls.map((url) => expectUrlIsValidImage(url)))
}

export const apiBatchTest = async <T>(args: {
	numRequests: number,
	apiPromiseGetter: () => Promise<AxiosResponse<T>>,
	successCB?: (num: number, apiResponse: AxiosResponse<T>) => void,
	errorCB?: (num: number, errRes: AxiosError<API.Error>) => void
}): Promise<void> => {
	const promises: Promise<unknown>[] = []
	let requestsFinished = 1
	for (let i = 1; i <= args.numRequests; i++) {
		const promise = args.apiPromiseGetter()
		promises.push(promise
			.then((res) => args.successCB?.(requestsFinished, res))
			.catch((res: AxiosError<API.Error>) => args.errorCB?.(requestsFinished, res))
			.finally(() => requestsFinished++))
	}
	await Promise.all(promises)
}