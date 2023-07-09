import authConfig from "../../src/config/auth.config"
import { AuthError, DatabaseError } from "../../src/errors"
import { createTestUser } from "../data/api"
import { createUser, createUserToken, getUser } from "../database/auth.database"
import { APIHelpers, apiDBSuccessTest, apiErrorTest, filterID, hash } from "../helpers"
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
		const user = await createUser(resetPasswordUser.createArgs)
		const resetPassToken = await createUserToken({
			type: "password_reset",
			expiresAt: getDBDate(Date.now() + (authConfig.passwordResetTimeoutMins * 1000 * 60)),
			userId: user.id
		})

		const newPassword = "NEW_PASSWORD12"
		const hashed = await hash(newPassword)

		await apiDBSuccessTest({
			apiPromise: APIHelpers.resetPassword({
				newPassword,
				token: filterID(resetPassToken.id)
			}),
			dbGetter: () => getUser("username", user.username),
			matchArgs: {...resetPasswordUser.matchArgs, passwordHash: hashed}
		})
	})
	
	
	it("Works with a token just before expiry", async () => {
		const user = await createUser(resetPasswordUser.createArgs)
		const resetPassToken = await createUserToken({
			type: "password_reset",
			expiresAt: getDBDate(Date.now() + 1000 * 60 * 10),
			userId: user.id
		})

		const newPassword = "NEW_PASSWORD12"
		const hashed = await hash(newPassword)

		await apiDBSuccessTest({
			apiPromise: APIHelpers.resetPassword({token: filterID(resetPassToken.id), newPassword}),
			dbGetter: () => getUser("username", user.username),
			matchArgs: {...resetPasswordUser.matchArgs, passwordHash: hashed}
		})
	})
	
	it("Errors with the incorrect token", async () => {
		const user = await createUser(resetPasswordUser.createArgs)
		await createUserToken({
			type: "password_reset",
			expiresAt: getDBDate(Date.now() + 1000 * 60 * 10),
			userId: user.id
		})

		await apiErrorTest(
			APIHelpers.resetPassword({token: "WRONG_TOKEN", newPassword: "somePassworads213123"}),
			DatabaseError.UserNotFound
		)
	})
	
	it("Errors with an expired token", async () => {
		const user = await createUser(resetPasswordUser.createArgs)
		const resetPassToken = await createUserToken({
			type: "password_reset",
			expiresAt: getDBDate(Date.now() - 1000 * 60 * 10),
			userId: user.id
		})

		await apiErrorTest(
			APIHelpers.resetPassword({token: filterID(resetPassToken.id), newPassword: "Siuhasd879789"}),
			AuthError.ExpiredPasswordRestToken
		)
	})
})