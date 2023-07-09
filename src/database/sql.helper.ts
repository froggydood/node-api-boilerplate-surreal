import { MapQueryResult, QueryResult, RawQueryResult } from "surrealdb.js/script/types"
import { DatabaseError, HTTPError } from "../errors"

export const generateSetStatement = (data: Record<string, unknown>): {
	sql: string,
	values: Record<string, unknown>
} => {
	const keys = Object.keys(data)
	const setStatement = keys.map((key, index) => `${key} = $${key}`).join(", ")
	return { sql: setStatement, values: data}
}

export const handleDBError = (errorCode = DatabaseError.QueryError) => {
	return (err: unknown) => {
		console.error(err)
		throw new HTTPError(errorCode)
	}
}

export const handleDBQueryResult = <T extends RawQueryResult>(
	res: MapQueryResult<T[]>[0]
): T => {
	if (res.status === "ERR") {
		console.error(res.detail)
		throw new HTTPError(DatabaseError.QueryError)
	}

	return res.result
}

export type QueryResponseType = "first" | "last" | "all" | number

export type QueryResponse<
	T extends RawQueryResult[],
	ResType extends QueryResponseType
> = ResType extends "first"
	? T extends [infer First, ...unknown[]] 
		? First : T[number]
	: ResType extends "last"
		? T extends [...unknown[], infer Last]
			? Last : T[number]
		: ResType extends "all"
			? T
			: ResType extends number
				? T[ResType]
				: never

export const handleDBQuery = async <
	T extends RawQueryResult[],
	ResType extends QueryResponseType
>(
	query: Promise<MapQueryResult<T>>,
	queryResponseType: ResType
): Promise<QueryResponse<T, ResType>> => {
	const res = await query.catch(handleDBError())

	if (queryResponseType === "first") {
		const item = Array.isArray(res) ? res[0] : res
		const data = handleDBQueryResult(item)
		return data as QueryResponse<T, ResType>
	} else if (queryResponseType === "last") {
		const item = Array.isArray(res) ? res.slice(-1)[0] : res
		const data = handleDBQueryResult(item)
		return data as QueryResponse<T, ResType>
	} else if (queryResponseType === "all") {
		const data = Array.isArray(res) ? res.map((v) => handleDBQueryResult(v)) : handleDBQueryResult(res)
		return data as any
	} else {
		const data = handleDBQueryResult(res[queryResponseType as any] as any)
		return data as QueryResponse<T, ResType>
	}
}