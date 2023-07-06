import jwt from "jsonwebtoken"
import env from "../env"
import { HTTPError, AuthError } from "../errors"
import { API, DB } from "../types"
import Application from "koa"
import redis from "../redis/client"

const roleMap: Record<DB.UserRole, DB.Permission[]> = {
	user: [],
	admin: [
		DB.Permission.DeleteOtherUsersThemes,
		DB.Permission.GetOtherUsers,
		DB.Permission.EditOtherUsers
	]
}

export const getPermissions = (
	role: DB.UserRole,
	permissions: DB.Permission[] = []
): DB.Permission[]  => {
	return [
		...roleMap[role],
		...permissions
	]
}

export const createToken = async (args: API.TokenData, expiresInSecs: number): Promise<API.Token> => {
	const expiresAt = ((Date.now() / 1000) + expiresInSecs) * 1000
		
	const token = await new Promise((resolve, reject) => {
		jwt.sign({
			...args,
			created_at: Date.now(),
		}, env.JWT_SECRET, {expiresIn: expiresInSecs + "s"}, (err, token) => {
			if (err) return reject(new HTTPError(AuthError.ErrorCreatingToken))
			resolve(token)	
		})
	})
	
	return {
		token: token as any,
		expiresAt: expiresAt
	}
}

export interface CreateTokenArgs {
	userId: string,
	userRole: DB.UserRole,
	permissions?: DB.Permission[],
	tokenNumber: number
}

export const createAccessToken = (args: CreateTokenArgs) => createToken({...args, type: "access", permissions: args.permissions || []}, env.JWT_ACCESS_EXPIRES_IN)
export const createRefreshToken = (args: CreateTokenArgs) => createToken({...args, type: "refresh", permissions: args.permissions || []}, env.JWT_REFRESH_EXPIRES_IN)
export const createTokens = async (args: CreateTokenArgs): Promise<API.Tokens> => {
	return {
		access: await createAccessToken(args),
		refresh: await createRefreshToken(args)
	}
}

export const getTokenData = async (token: string): Promise<API.TokenData> => {
	const payload = await new Promise<jwt.JwtPayload>((resolve, reject) => {
		jwt.verify(token, env.JWT_SECRET, {}, (err, decoded) => {
			if (err || !decoded || typeof(decoded) === "string") {
				return reject(err)
			}
			resolve(decoded)
		})
	}).catch((err) => {
		if ((err as jwt.JsonWebTokenError)?.name === "TokenExpiredError") {
			throw new HTTPError(AuthError.ExpiredAuthToken)
		}
		throw new HTTPError(AuthError.InvalidAuthToken)
	})

	return payload as API.TokenData
}

export const getTokenAndCheckPermissions = async (ctx: Application.Context, permissions?: number[]): Promise<API.TokenData> => {
	const token = ctx.request.headers["authorization"]?.substring("BEARER ".length)
	
	if (!token) {
		throw new HTTPError(AuthError.NoToken)
	}
	
	const tokenData = await getTokenData(token)
	
	if (tokenData.type !== "access") throw new HTTPError(AuthError.InvalidAuthToken)

	if (permissions && permissions.length > 0) {
		const tokenPermissions = getPermissions(tokenData.userRole, tokenData.permissions)
		let tokenAuthorized = true
		const unmatchedPermissions: number[] = []

		permissions.forEach((permission) => {
			if (!tokenPermissions.includes(permission)) {
				tokenAuthorized = false
				unmatchedPermissions.push(permission)
			}
		})
		if (!tokenAuthorized) throw new HTTPError(AuthError.InvalidPermissions, undefined, {unmatchedPermissions})
		return tokenData
	}

	return tokenData
}

export interface UserKVItem {
	token_number: number
}

export const getUserTokenNumber = async (userId: string): Promise<number> => {
	const userDataStr = await redis.get(userId)
	if (!userDataStr) return 0

	try {
		const userData = JSON.parse(userDataStr) as UserKVItem
		return userData?.token_number
	} catch(err) {
		return 0
	}
}

export interface TokenKVItem {
	valid: boolean
}

export const refreshTokenIsValid = async (token: string, tokenData: API.TokenData): Promise<boolean> => {
	const oldTokenNum = await getUserTokenNumber(tokenData.userId)
	if (oldTokenNum !== tokenData.tokenNumber) return false

	const tokenResStr = await redis.get(token)
	if (!tokenResStr) return true
	try {
		const tokenRes = JSON.parse(tokenResStr) as TokenKVItem
		if (tokenRes?.valid === false) return false
	} catch(err) {
		return true
	}

	return true
}

export const invalidateRefreshToken = async (token: string): Promise<void> => {
	const data: TokenKVItem = {
		valid: false
	}

	await redis.set(token, JSON.stringify(data))
}

export const invalidateAllRefreshTokens = async (userId: string): Promise<void> => {
	const userDataStr = await redis.get(userId)
	let newData: UserKVItem
	if (!userDataStr) newData = {token_number: 1}
	else {
		try {
			const userData = JSON.parse(userDataStr) as UserKVItem 
			newData = {
				...userData,
				token_number: (userData.token_number || 0) + 1
			}
		} catch {
			newData = {token_number: 1}
		}
	}

	await redis.setEx(userId, env.JWT_REFRESH_EXPIRES_IN, JSON.stringify(newData))
}