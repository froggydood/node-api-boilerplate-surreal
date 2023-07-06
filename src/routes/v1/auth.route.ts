import Router from "../../middleware/router.middleware"
import { handleRequest } from "../../helpers/route.helper"
import { changePasswordSchema, forgotPasswordSchema, loginRequestSchema, refreshTokenSchema, registerRequestSchema, resetPasswordSchema } from "../../schema"
import { changePasswordHandler, forgotPasswordHandler, loginHandler, refreshTokenHandler, registerHandler, resetPasswordHandler, sendVerificationEmailHandler, verifyEmailHandler } from "../../services/auth.service"

const router = new Router()

router.post("/register", async (ctx) => {
	await handleRequest({
		ctx, handler: registerHandler,
		schema: registerRequestSchema
	})
})

router.post("/login", async (ctx) => {
	await handleRequest({
		ctx, handler: loginHandler,
		schema: loginRequestSchema
	})
})

router.post("/refresh-token", async (ctx) => {
	await handleRequest({
		ctx, handler: refreshTokenHandler,
		schema: refreshTokenSchema
	})
})

router.post("/change-password", async (ctx) => {
	await handleRequest({
		ctx, handler: changePasswordHandler,
		schema: changePasswordSchema,
		authenticate: true
	})
})

router.post("/send-verification-email", async (ctx) => {
	await handleRequest({
		ctx, handler: sendVerificationEmailHandler,
		authenticate: true
	})
})

router.get("/verify", async (ctx) => {
	await handleRequest({
		ctx, handler: verifyEmailHandler
	})
})

router.post("/forgot-password", async (ctx) => {
	await handleRequest({
		ctx, handler: forgotPasswordHandler,
		schema: forgotPasswordSchema
	})
})

router.post("/reset-password", async (ctx) => {
	await handleRequest({
		ctx, handler: resetPasswordHandler,
		schema: resetPasswordSchema
	})
})

export default router