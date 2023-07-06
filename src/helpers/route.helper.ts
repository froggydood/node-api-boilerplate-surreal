import { z } from "zod"

import { HTTPError, ValidationError, UtilError } from "../errors"
import { getSchemaErrorMessage } from "../schema"
import { getTokenAndCheckPermissions, getTokenData } from "./auth.helper"

import { RouterContext } from "../middleware/router.middleware"
import Application from "koa"
import { API } from "../types"

type SchemaMatchResponse = [false, z.ZodError] | [true, undefined]

export const matchesSchema = (data: unknown, schema: z.Schema): SchemaMatchResponse => {
	const response = schema.safeParse(data)
	if (response.success) return [true, undefined]
	return [false, response.error]
}

export const handleError = (ctx: Application.Context, err: unknown) => {
	let httpErr: HTTPError = new HTTPError(UtilError.DefaultError)

	if (err && (err as Record<string, unknown>)?.baseClass === "HTTPError") httpErr = err as HTTPError
	else console.error(err)

	ctx.status = httpErr.statusCode
	ctx.body = {
		success: false,
		error: {
			message: httpErr.message,
			baseMessage: httpErr.baseMessage,
			errorCode: httpErr.errorCode,
			data: httpErr.data
		},
		data: undefined
	} as API.Error
}

export type HandlerArgs<T> = {
	ctx: RouterContext,
	body: T,
	permissions: number[],
	tokenData?: API.TokenData
}

export type Handler<T  = null> = (args: HandlerArgs<T>) => void;

export type HandleRequestArgs<T> = {
	ctx: RouterContext,
	handler: Handler<T>,
	schema?: z.Schema,
	permissions?: number[],
	authenticate?: boolean,
	getAuthentication?: boolean
}

export const checkSchema = (data: any, schema: z.Schema) => {
	const [ success, errorObj ] = matchesSchema(data, schema)
	if (!success) {
		throw new HTTPError(
			ValidationError.InvalidData,
			getSchemaErrorMessage(errorObj)
		)
	}
}

export const handleRequest = async <T>({
	ctx, handler, schema, authenticate, getAuthentication, permissions
}: HandleRequestArgs<T>) => {
	const data: T = ctx.request.body

	const handlerArgs: HandlerArgs<T> = {
		ctx,
		body: data,
		permissions: permissions || []
	}

	try {
		if (schema) checkSchema(data, schema)
		if (authenticate) handlerArgs.tokenData = await getTokenAndCheckPermissions(ctx)
		else if (getAuthentication) {
			try {
				const token = ctx.request.headers["authorization"]?.substring("BEARER ".length)
				if (!token) throw ""
				const tokenData = await getTokenData(token)
				handlerArgs.tokenData = tokenData
			} catch {}
		}

		await handler(handlerArgs)
	} catch(err) {
		await handleError(ctx, err)
	}
}