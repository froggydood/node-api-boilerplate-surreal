import { createTestUser, tokensMatchData } from "../data/api"
import { createUser } from "../database/auth.database"
import { APIHelpers, apiErrorTest, apiSuccessTest } from "../helpers"
import { AuthError } from "../../src/errors"
import { deleteAllUsersLike } from "../database/auth.database"
  
const loginUser = createTestUser({
	username: "Login_Test_User",
	email: "login@test.com",
	firstName: "Login",
	lastName: "Loginson",
	password: "test1234"
})

describe("Login", () => {
	beforeEach(async () => await deleteAllUsersLike("username", "Login_Test_User%"))
	afterAll(async () => {
		await deleteAllUsersLike("username", "Login_Test_User%")
	})

	it("Successfully signs in", async () => {
		await createUser(loginUser.createArgs)

		const res = await apiSuccessTest({
			apiPromise: APIHelpers.login(loginUser.loginArgs),
			apiDataGetter: (res) => res.data.user,
			matchArgs: loginUser.matchArgs
		})
		expect(res.data.tokens).toMatchObject(tokensMatchData)
	})

	it("Errors when using incorrect password", async () => {
		await createUser(loginUser.createArgs)

		await apiErrorTest(
			APIHelpers.login({...loginUser.loginArgs, password: "wrong_password"}),
			AuthError.IncorrectUsernamePasswordCombo
		)
	})
})