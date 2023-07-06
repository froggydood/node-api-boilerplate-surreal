import { z } from "zod"

export const loginRequestSchema = z.object({
	email: z.string(),
	password: z.string()
})

export const passwordSchema = z.string()
	.min(6)
	.max(60)
	.regex(/([0-9][a-zA-Z])|([a-zA-Z][0-9])/, "Needs at least 1 number and 1 letter")
	.regex(/^[a-zA-Z0-9[\]\\/;:'@#~.>,<?!"£$%^&*()_\-+=¬`|]+$/, "Must not contain special unicode or emoji characters")

export const usernameSchema = z.string().min(5).max(40)

export type LoginRequestSchema = z.infer<typeof loginRequestSchema>

export const registerRequestSchema = z.object({
	username: usernameSchema,
	password: passwordSchema,
	email: z.string().email().max(140),
	firstName: z.string().max(60),
	lastName: z.string().max(60)
})

export type RegisterRequestSchema = z.infer<typeof registerRequestSchema>

export const refreshTokenSchema = z.object({
	refreshToken: z.string()
})

export type RefreshTokenSchema = z.infer<typeof refreshTokenSchema>

export const updateUserSchema = z.object({
	firstName: z.string().max(60).optional(),
	lastName: z.string().max(60).optional()
})

export type UpdateUserSchema = z.infer<typeof updateUserSchema>

export const changePasswordSchema = z.object({
	oldPassword: z.string().max(60),
	newPassword: passwordSchema
})

export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>

export const forgotPasswordSchema = z.object({
	email: z.string().email()
})

export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z.object({
	token: z.string(),
	newPassword: passwordSchema
})

export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>