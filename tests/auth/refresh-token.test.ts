import { AuthError, ValidationError } from "../../src/errors"
import { createTestUser, tokensMatchData } from "../data/api"
import { deleteAllUsersLike } from "../database/auth.database"
import { APIHelpers, apiErrorTest, apiSuccessTest } from "../helpers"

const refreshTokenUser = createTestUser({
	username: "Refresh_Token_Test_User",
	email: "refresh.email@test.com",
	firstName: "Refresh",
	lastName: "Tokenson",
	password: "test1234"
})

describe("Refresh token", () => {
	beforeEach(async () => await deleteAllUsersLike("username", "Refresh_Token_Test_User%"))
	afterAll(async () => {
		await deleteAllUsersLike("username", "Refresh_Token_Test_User%")
	})

	it("Successfully gets and refreshes tokens", async () => {
		const registerRes = await APIHelpers.register(refreshTokenUser.registerArgs)
		const { tokens } = registerRes.data

		apiSuccessTest({
			apiPromise: APIHelpers.refreshToken({ refreshToken: tokens.refresh.token}),
			apiDataGetter: (res) => res.data,
			matchArgs: tokensMatchData
		})
	})

	it("Errors when using the same refresh token multiple times", async () => {
		const registerRes = await APIHelpers.register(refreshTokenUser.registerArgs)
		const { tokens } = registerRes.data

		await apiSuccessTest({
			apiPromise: APIHelpers.refreshToken({ refreshToken: tokens.refresh.token}),
			apiDataGetter: (res) => res.data,
			matchArgs: tokensMatchData
		})

		await apiErrorTest(
			APIHelpers.refreshToken({ refreshToken: tokens.refresh.token}),
			AuthError.InvalidAuthToken
		)
		
		await apiErrorTest(
			APIHelpers.refreshToken({ refreshToken: tokens.refresh.token}),
			AuthError.InvalidAuthToken
		)
	})

	it("Errors when no token is provided", async () => {
		await apiErrorTest(
			APIHelpers.refreshToken({refreshToken: null as any}),
			ValidationError.InvalidData
		)
		
		await apiErrorTest(
			APIHelpers.refreshToken({} as any),
			ValidationError.InvalidData
		)
	})

	it("Errors when token provided is invalid", async () => {
		await apiErrorTest(
			APIHelpers.refreshToken({refreshToken: "asjkhdfashkldgas"}),
			AuthError.InvalidAuthToken
		)
	})
})