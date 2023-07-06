import { DB } from "./database.types"

export namespace API {
	export interface Error {
		success: false,
		error: {
			message: string,
			baseMessage: string,
			errorCode: number,
			data: any
		},
		data: undefined
	}

	export type User = Omit<
		DB.User,
		"passwordHash" | "permissions" |
		"verificationToken" | "verificationTokenGeneratedAt" |
		"passwordResetToken" | "passwordResetTokenGeneratedAt" |
		"passwordResetTokenUsed"
	>

	export interface Token {
		expiresAt: number,
		token: string
	}

	export interface Tokens {
		access: Token,
		refresh: Token
	}

	export interface TokenData {
		userId: string,
		permissions: DB.Permission[],
		userRole: DB.UserRole,
		type: "refresh" | "access",
		tokenNumber: number
	}

	export interface LoginResponse {
		user: User,
		tokens: Tokens
	}

	export interface TokensResponse {
		tokens: Tokens
	}
}