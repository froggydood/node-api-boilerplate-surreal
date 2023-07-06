import env from "../config/env"
import jwt from "jsonwebtoken"
import { DB } from "../../src/types"

export interface TokenData {
	userId: string,
	permissions: DB.Permission[],
	user_role: DB.UserRole,
	type: "refresh" | "access",
	token_number: number
}
export interface TokenValue {
	expiresAt: number,
	token: string
}

export const createToken = async (args: TokenData, expiresIn = 30_000): Promise<TokenValue> => {
	const token = await jwt.sign({
		...args
	}, env.JWT_SECRET, {expiresIn: `${expiresIn}ms`})

	return {
		token,
		expiresAt: ((Date.now() / 1000) + expiresIn) * 1000
	}
}

export const createUserAccessToken = (user: DB.User, args?: Partial<TokenData>): Promise<TokenValue> => {
	return createToken({
		permissions: user.permissions,
		token_number: 0,
		type: "access",
		userId: user.userId,
		user_role: "user",
		...(args || {})
	})
}