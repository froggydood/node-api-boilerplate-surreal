import { createUser, getUser, getUserById, updateUser, updateUserById, updateUserPassword, verifyUser } from "../database/auth.database"
import { getDBDate, isDateExpired } from "../helpers"
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

import nanoid from "nanoid"
import authConfig from "../config/auth.config"
import { API } from "../types"

export const registerHandler: Handler<RegisterRequestSchema> = async ({
	ctx, body
}) => {
	const userId = nanoid()
	const verificationToken = nanoid()
	const user = await createUser({
		...body,
		userId: userId,
		verificationToken: verificationToken
	})

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

	sendVerificationEmail(user.email, verificationToken).catch(() => {
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

	const verificationToken = nanoid()

	const user = await getUserById(tokenData.userId)

	if (user.verified) throw new HTTPError(AuthError.UserAlreadyVerified)

	await updateUserById(
		tokenData.userId, {
			verificationToken: verificationToken,
			verificationTokenGeneratedAt: getDBDate(Date.now())
		}
	)

	await sendVerificationEmail(user.email, verificationToken)

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
	const forgotPasswordToken = nanoid()

	await updateUser(
		"email", body.email, {
			passwordResetToken: forgotPasswordToken,
			passwordResetTokenGeneratedAt: getDBDate(Date.now())
		}
	)

	await sendForgotPasswordEmail(body.email, forgotPasswordToken)

	ctx.status = 204
}

export const resetPasswordHandler: Handler<ResetPasswordSchema> = async({
	ctx, body
}) => {
	const newHash = await hash(body.newPassword)

	const user = await getUser("passwordResetToken", body.token)

	if (user.passwordHash === newHash) throw new HTTPError(AuthError.PasswordsAreTheSame)
	if (!user.passwordResetTokenGeneratedAt || isDateExpired(user.passwordResetTokenGeneratedAt, authConfig.passwordResetTimeoutMins)) throw new HTTPError(AuthError.ExpiredPasswordRestToken)

	await updateUser("passwordResetToken", body.token, {
		passwordHash: newHash, passwordResetTokenUsed: true
	})

	ctx.status = 204
}