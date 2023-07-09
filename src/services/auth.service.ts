import { createUserToken, createUser, getUser, getUserById, updateUserPassword, verifyUser, recreateUserToken, getUserAndTokenFromTokenId, deleteUserToken, updateUserById } from "../database/auth.database"
import { filterID } from "../helpers"
import {
	CreateTokenArgs,
	createTokens,
	getTokenData,
	getUserTokenNumber,
	invalidateAllRefreshTokens,
	invalidateRefreshToken,
	refreshTokenIsValid,
	sendForgotPasswordEmail,
	sendVerificationEmail
} from "../helpers"
import { filterUser, Handler } from "../helpers"
import { HTTPError, AuthError, DatabaseError } from "../errors"
import { checkHash, hash } from "../helpers"
import {
	ChangePasswordSchema,
	ForgotPasswordSchema,
	LoginRequestSchema,
	RefreshTokenSchema,
	RegisterRequestSchema,
	ResetPasswordSchema
} from "../schema"

import authConfig from "../config/auth.config"
import { API } from "../types"

export const registerHandler: Handler<RegisterRequestSchema> = async ({
	ctx, body
}) => {
	const user = await createUser(body)
	const verificationToken = await createUserToken({
		type: "verification",
		userId: user.id,
		expiresAt: new Date(Date.now() + authConfig.verificationTimeoutMins * 60 * 1000)
	})
	console.log("CREATED VERIFICATION TOKEN", verificationToken)

	const tokenNumber = await getUserTokenNumber(user.id)

	const tokenArgs: CreateTokenArgs = {
		userRole: user.userRole,
		userId: user.id,
		permissions: user.permissions,
		tokenNumber: tokenNumber
	}
	const tokens = await createTokens(tokenArgs)
	
	ctx.status = 201
	ctx.body = {
		user: filterUser(user),
		tokens
	}

	sendVerificationEmail(user.email, verificationToken.id).catch(() => {
		console.log("Error sending verification email")
	})
}

export const loginHandler: Handler<LoginRequestSchema> = async ({
	ctx, body
}) => {
	const user = await getUser("email", body.email)
	const passwordMatches = await checkHash(body.password, user.passwordHash)

	if (!passwordMatches) throw new HTTPError(AuthError.IncorrectUsernamePasswordCombo)

	const tokenNumber = await getUserTokenNumber(user.id)

	const tokenArgs: CreateTokenArgs = {
		userRole: user.userRole,
		userId: user.id,
		permissions: user.permissions,
		tokenNumber: tokenNumber
	}
	const tokens = await createTokens(tokenArgs)

	ctx.status = 200
	ctx.body = {
		user: filterUser(user),
		tokens
	}
}

export const refreshTokenHandler: Handler<RefreshTokenSchema> = async ({
	ctx, body
}) => {
	const refreshTokenData = await getTokenData(body.refreshToken)
	if (refreshTokenData.type !== "refresh") throw new HTTPError(AuthError.InvalidAuthToken)

	const refreshValid = await refreshTokenIsValid(body.refreshToken, refreshTokenData)
	if (!refreshValid) throw new HTTPError(AuthError.InvalidAuthToken)

	const tokens = await createTokens({
		userRole: refreshTokenData.userRole,
		permissions: refreshTokenData.permissions,
		userId: refreshTokenData.userId,
		tokenNumber: refreshTokenData.tokenNumber
	})

	ctx.status = 200
	ctx.body = tokens as API.Tokens
	
	await invalidateRefreshToken(body.refreshToken)
}

export const changePasswordHandler: Handler<ChangePasswordSchema> = async ({
	ctx, body, tokenData
}) => {
	if (!tokenData?.userId) throw new HTTPError(DatabaseError.UserNotFound)
	if (body.newPassword === body.oldPassword) throw new HTTPError(AuthError.PasswordsAreTheSame)

	const user = await updateUserPassword(tokenData?.userId, body.oldPassword, body.newPassword)
	
	
	await invalidateAllRefreshTokens(user.id)
	
	const tokens = await createTokens({
		userRole: user.userRole,
		permissions: user.permissions,
		userId: user.id,
		tokenNumber: tokenData.tokenNumber
	})

	ctx.status = 200
	ctx.body = {user: filterUser(user), tokens}
	
}

export const sendVerificationEmailHandler: Handler = async ({
	ctx, body, tokenData
}) => {
	if (!tokenData?.userId) throw new HTTPError(DatabaseError.UserNotFound)

	const user = await getUserById(tokenData.userId)

	if (user.verified) throw new HTTPError(AuthError.UserAlreadyVerified)

	const newToken = await recreateUserToken(tokenData.userId, {type: "verification"})

	await sendVerificationEmail(user.email, filterID(newToken.id))

	ctx.status = 204
}

export const verifyEmailHandler: Handler = async ({
	ctx
}) => {
	const token = ctx.query["token"]

	if (!token || Array.isArray(token)) throw new HTTPError(AuthError.NoToken)

	await verifyUser(token)

	ctx.status = 204
}

export const forgotPasswordHandler: Handler<ForgotPasswordSchema> = async({
	ctx, body
}) => {
	const newToken = await recreateUserToken(body.email, {
		type: "password_reset"
	})
	await sendForgotPasswordEmail(body.email, filterID(newToken.id))

	ctx.status = 204
}

export const resetPasswordHandler: Handler<ResetPasswordSchema> = async({
	ctx, body
}) => {
	const newHash = await hash(body.newPassword)

	const { user, ...token } = await getUserAndTokenFromTokenId({
		tokenId: body.token,
		tokenType: "password_reset"
	})

	if (user.passwordHash === newHash) throw new HTTPError(AuthError.PasswordsAreTheSame)
	if (token.expiresAt && Date.now() >= new Date(token.expiresAt).getTime()) throw new HTTPError(AuthError.ExpiredPasswordRestToken)

	await updateUserById(user.id, {
		passwordHash: newHash
	})

	await deleteUserToken(token.id)

	ctx.status = 204
}