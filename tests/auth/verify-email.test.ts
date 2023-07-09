import authConfig from "../../src/config/auth.config"
import { AuthError, DatabaseError } from "../../src/errors"
import { createTestUser } from "../data/api"
import { createUser, createUserToken, getUser, verifyUser } from "../database/auth.database"
import { APIHelpers, apiDBSuccessTest, apiErrorTest, filterID } from "../helpers"
import { getDBDate } from "../helpers/date.helper"
import { deleteAllUsersLike } from "../database/auth.database"

const verifyEmailUser = createTestUser({
	username: "Verify_Email_Test_User",
	email: "verify.email@test.com",
	firstName: "Verify",
	lastName: "Emailson",
	password: "test1234"
})

describe("Verify email", () => {
	beforeEach(async () => await deleteAllUsersLike("username", "Verify_Email_Test_User%"))
	afterAll(async () => {
		await deleteAllUsersLike("username", "Verify_Email_Test_User%")
	})

	it("Successfully verifies user's email", async () => {
		const user = await createUser(verifyEmailUser.createArgs)
		const verifyUserToken = await createUserToken({
			type: "verification",
			expiresAt: getDBDate(Date.now() + (authConfig.verificationTimeoutMins * 1000 * 60)),
			userId: user.id,
		})

		await apiDBSuccessTest({
			apiPromise: APIHelpers.verifyEmail(filterID(verifyUserToken.id)),
			dbGetter: () => getUser("username", verifyEmailUser.registerArgs.username),
			matchArgs: {verified: true}
		})
	})
	
	it("Errors with the incorrect token", async () => {
		const user = await createUser(verifyEmailUser.createArgs)
		await createUserToken({
			type: "verification",
			expiresAt: getDBDate(Date.now() + (authConfig.verificationTimeoutMins * 1000 * 60)),
			userId: user.id,
		})

		await apiErrorTest(
			APIHelpers.verifyEmail("WRONG_TOKEN"),
			DatabaseError.UserNotFound
		)
	})
	
	it("Errors with an expired token", async () => {
		const user = await createUser(verifyEmailUser.createArgs)
		const verifyUserToken = await createUserToken({
			type: "verification",
			expiresAt: getDBDate(Date.now() - 1000 * 60 * 10),
			userId: user.id,
		})		

		await apiErrorTest(
			APIHelpers.verifyEmail(filterID(verifyUserToken.id)),
			AuthError.ExpiredVerificationToken
		)
	})
})