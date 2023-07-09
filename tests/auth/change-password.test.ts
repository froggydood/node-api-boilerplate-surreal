import { AuthError, ValidationError } from "../../src/errors"
import { createTestUser } from "../data/api"
import { createUser, getUser } from "../database/auth.database"
import { APIHelpers, apiAuthenticationTest, apiDBSuccessTest, apiErrorTest, hash } from "../helpers"
import { deleteAllUsersLike } from "../database/auth.database"

const changePasswordUser = createTestUser({
	username: "Change_Password_Test_User",
	email: "change.password@test.com",
	firstName: "Change",
	lastName: "Passwordson",
	password: "test1234"
})

describe("Change password", () => {
	beforeEach(async () => await deleteAllUsersLike("username", "Change_Password_Test_User%"))
	afterAll(async () => {
		await deleteAllUsersLike("username", "Change_Password_Test_User%")
	})

	it("Successfully changes user password", async () => {
		const res = await APIHelpers.register(changePasswordUser.registerArgs)
		const { user, tokens } = res.data

		const newPassword = "Some_new_password12314!"
		const newHashed = await hash(newPassword)

		await apiDBSuccessTest({
			apiPromise: APIHelpers.changePassword({
				oldPassword: changePasswordUser.registerArgs.password,
				newPassword: newPassword
			}, tokens.access.token),
			dbGetter: () => getUser("username", user.username),
			matchArgs: {passwordHash: newHashed}
		})
	})
	
	it("Successfully invalidates old refresh tokens", async () => {
		const res = await APIHelpers.register(changePasswordUser.registerArgs)
		const { user, tokens } = res.data

		const newPassword = "Some_new_password12314!"
		const newHashed = await hash(newPassword)

		await apiDBSuccessTest({
			apiPromise: APIHelpers.changePassword({
				oldPassword: changePasswordUser.registerArgs.password,
				newPassword: newPassword
			}, tokens.access.token),
			dbGetter: () => getUser("username", user.username),
			matchArgs: {passwordHash: newHashed}
		})

		await apiErrorTest(APIHelpers.refreshToken({refreshToken: tokens.refresh.token}), AuthError.InvalidAuthToken)
	})

	it("Errors when using the same password", async () => {
		const res = await APIHelpers.register(changePasswordUser.registerArgs)
		const { tokens } = res.data

		await apiErrorTest(
			APIHelpers.changePassword({
				oldPassword: changePasswordUser.registerArgs.password,
				newPassword: changePasswordUser.registerArgs.password
			}, tokens.access.token), 
			AuthError.PasswordsAreTheSame
		)
	})

	it("Errors when using the incorrect old password", async () => {
		const res = await APIHelpers.register(changePasswordUser.registerArgs)
		const { tokens } = res.data

		await apiErrorTest(
			APIHelpers.changePassword({
				oldPassword: "wrong_password",
				newPassword: changePasswordUser.registerArgs.password
			}, tokens.access.token), 
			AuthError.PasswordsDontMatch
		)
	})

	it("Errors when using invalid authentication", async () => {
		const user = await createUser(changePasswordUser.createArgs)

		await apiAuthenticationTest({
			apiPromise: (token) => APIHelpers.changePassword({
				oldPassword: changePasswordUser.registerArgs.password,
				newPassword: "Some_new_password12314!"
			}, token),
			userId: user.id,
			permissions: user.permissions,
			userRole: user.userRole
		})
	})

	it("Errors when using invalid new passwords", async () => {
		const res = await APIHelpers.register(changePasswordUser.registerArgs)
		const { tokens } = res.data

		await apiErrorTest(
			APIHelpers.changePassword({
				oldPassword: changePasswordUser.registerArgs.password,
				newPassword: "shor1"
			}, tokens.access.token), 
			ValidationError.InvalidData
		)
		
		await apiErrorTest(
			APIHelpers.changePassword({
				oldPassword: changePasswordUser.registerArgs.password,
				newPassword: "no_numbers"
			}, tokens.access.token), 
			ValidationError.InvalidData
		)

		await apiErrorTest(
			APIHelpers.changePassword({
				oldPassword: changePasswordUser.registerArgs.password,
				newPassword: "12380123780"
			}, tokens.access.token), 
			ValidationError.InvalidData
		)
		
		await apiErrorTest(
			APIHelpers.changePassword({
				oldPassword: changePasswordUser.registerArgs.password,
				newPassword: "has😋emoji"
			}, tokens.access.token), 
			ValidationError.InvalidData
		)
	})
})