import { AuthError, ValidationError } from "../../src/errors"
import { tokensMatchData, createTestUser } from "../data/api"
import { createUser, getUserById } from "../database/auth.database"
import { apiDBSuccessTest, apiErrorTest, register } from "../helpers"
import { deleteAllUsersLike } from "../database/auth.database"

const registerUser = createTestUser({
	username: "Register_Test_User",
	email: "register@test.com",
	firstName: "Register",
	lastName: "Registerson",
	password: "test1234"
})

const registerUserSameEmail = createTestUser({
	username: "Register_Test_User_Diff_Name",
	email: "register@test.com",
	firstName: "Register",
	lastName: "Registerson",
	password: "test1234"
})

const registerUserSameUsername = createTestUser({
	username: "Register_Test_User",
	email: "register.diff.email@test.com",
	firstName: "Register",
	lastName: "Registerson",
	password: "test1234"
})

describe("Register", () => {
	beforeEach(async () => await deleteAllUsersLike("username", "Register_Test_User%"))
	afterAll(async () => {
		await deleteAllUsersLike("username", "Register_Test_User%")
	})
	it("Successfully registers a user", async () => {
		await apiDBSuccessTest({
			apiPromise: register(registerUser.registerArgs),
			dbGetter: (data) => getUserById(data.user.id),
			matchArgs: registerUser.matchArgs,
			expectCB: (data) => expect(data.tokens).toMatchObject(tokensMatchData)
		})
	})

	it("Errors when registering using existing email", async () => {
		await createUser(registerUser.createArgs)

		await apiErrorTest(
			register(registerUserSameEmail.registerArgs),
			AuthError.EmailAlreadyExists
		)
	})

	it("Errors when registering using existing username", async () => {
		await createUser(registerUser.createArgs)

		await apiErrorTest(
			register(registerUserSameUsername.registerArgs),
			AuthError.UsernameAlreadyExists
		)
	})
	
	it("Errors when registering using invalid email", async () => {
		await apiErrorTest(
			register({...registerUser.registerArgs, email: "fer.sada@asdas"}),
			ValidationError.InvalidData
		)
	})

	it("Errors when registering using too short username", async () => {
		await apiErrorTest(
			register({...registerUser.registerArgs, username: "fer"}),
			ValidationError.InvalidData
		)
	})
	
	it("Errors when registering using too short password", async () => {
		await apiErrorTest(
			register({...registerUser.registerArgs, password: "1!av"}),
			ValidationError.InvalidData
		)
	})
	
	it("Errors when registering using too simple password", async () => {
		await apiErrorTest(
			register({...registerUser.registerArgs, password: "testing"}),
			ValidationError.InvalidData
		)
	})

})