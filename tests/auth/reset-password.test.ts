import authConfig from "../../src/config/auth.config"
import { AuthError, DatabaseError } from "../../src/errors"
import { createTestUser } from "../data/api"
import { createUser, getUser } from "../database/auth.database"
import { apiDBSuccessTest, apiErrorTest, resetPassword, hash } from "../helpers"
import { getDBDate } from "../helpers/date.helper"
import { deleteAllUsersLike } from "../database/auth.database"

const resetPasswordUser = createTestUser({
	username: "Reset_Password_Test_User",
	email: "reset.password@test.com",
	firstName: "Reset",
	lastName: "Passwordson",
	password: "test1234"
})

describe("Reset password", () => {
	beforeEach(async () => {
		await deleteAllUsersLike("username", "Reset_Password_Test_User%")
	})
	afterAll(async () => {
		await deleteAllUsersLike("username", "Reset_Password_Test_User%")
	})

	it("Successfully resets user's password", async () => {
		const user = await createUser({
			...resetPasswordUser.createArgs,
			passwordResetToken: "TOKEN",
			passwordResetTokenGeneratedAt: getDBDate()
		})

		const newPassword = "NEW_PASSWORD12"
		const hashed = await hash(newPassword)

		await apiDBSuccessTest({
			apiPromise: resetPassword({
				newPassword,
				token: "TOKEN"
			}),
			dbGetter: () => getUser("username", user.username),
			matchArgs: {...resetPasswordUser.matchArgs, passwordHash: hashed}
		})
	})
	
	
	it("Works with a token just before expiry", async () => {
		const genDate = new Date(Date.now() - (authConfig.passwordResetTimeoutMins * 1000 * 59))
		const genAt = getDBDate(genDate)

		const user = await createUser({
			...resetPasswordUser.createArgs,
			passwordResetToken: "TOKEN",
			passwordResetTokenGeneratedAt: genAt
		})

		const newPassword = "NEW_PASSWORD12"
		const hashed = await hash(newPassword)

		await apiDBSuccessTest({
			apiPromise: resetPassword({token: user.passwordResetToken!, newPassword}),
			dbGetter: () => getUser("username", user.username),
			matchArgs: {...resetPasswordUser.matchArgs, passwordHash: hashed}
		})
	})
	
	it("Errors with the incorrect token", async () => {
		await createUser({
			...resetPasswordUser.createArgs,
			passwordResetToken: "TOKEN",
			passwordResetTokenGeneratedAt: getDBDate()
		})

		await apiErrorTest(
			resetPassword({token: "WRONG_TOKEN", newPassword: "somePassworads213123"}),
			DatabaseError.UserNotFound
		)
	})
	
	it("Errors with an expired token", async () => {
		const genDate = new Date(Date.now() - (authConfig.passwordResetTimeoutMins * 1000 * 60))
		const genAt = getDBDate(genDate)

		const user = await createUser({
			...resetPasswordUser.createArgs,
			passwordResetToken: "TOKEN",
			passwordResetTokenGeneratedAt: genAt
		})

		await apiErrorTest(
			resetPassword({token: user.passwordResetToken!, newPassword: "Siuhasd879789"}),
			AuthError.ExpiredPasswordRestToken
		)
	})
})