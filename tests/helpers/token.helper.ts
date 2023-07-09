import env from "../config/env"
import { DB } from "../../src/types"
import { createToken } from "../../src/helpers"

export interface TokenData {
	userId: string,
	permissions: DB.Permission[],
	userRole: DB.UserRole,
	type: "refresh" | "access",
	tokenNumber: number
}
export interface TokenValue {
	expiresAt: number,
	token: string
}

export const createUserAccessToken = (user: DB.User, args?: Partial<TokenData>): Promise<TokenValue> => {
	return createToken({
		permissions: user.permissions,
		tokenNumber: 0,
		type: "access",
		userId: user.id,
		userRole: "user",
		...(args || {})
	}, env.JWT_ACCESS_EXPIRES_IN)
}