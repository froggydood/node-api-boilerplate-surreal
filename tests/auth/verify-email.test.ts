import authConfig from "../../src/config/auth.config"
import { AuthError, DatabaseError } from "../../src/errors"
import { createTestUser } from "../data/api"
import { createUser, getUser } from "../database/auth.database"
import { apiDBSuccessTest, apiErrorTest, verifyEmail } from "../helpers"
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
		const token = "TOKEN"
		await createUser({
			...verifyEmailUser.createArgs,
			verificationToken: token,
			verificationTokenGeneratedAt: getDBDate()
		})

		await apiDBSuccessTest({
			apiPromise: verifyEmail(token),
			dbGetter: () => getUser("username", verifyEmailUser.registerArgs.username),
			matchArgs: {verified: true}
		})
	})
	
	it("Errors with the incorrect token", async () => {
		await createUser({
			...verifyEmailUser.createArgs,
			verificationToken: "TOKEN",
			verificationTokenGeneratedAt: getDBDate()
		})

		await apiErrorTest(
			verifyEmail("WRONG_TOKEN"),
			DatabaseError.UserNotFound
		)
	})
	
	it("Errors with an expired token", async () => {
		const genAt = getDBDate(new Date(Date.now() - (authConfig.verificationTimeoutMins * 1000 * 60)))

		const user = await createUser({
			...verifyEmailUser.createArgs,
			verificationToken: "TOKEN",
			verificationTokenGeneratedAt: genAt
		})

		await apiErrorTest(
			verifyEmail(user.verificationToken!),
			AuthError.ExpiredVerificationToken
		)
	})
})