import { createTestUser } from "../data/api"
import { createUser } from "../database/auth.database"
import { APIHelpers, apiAuthenticationTest, apiErrorTest, apiSuccessTest } from "../helpers"
import { AuthError } from "../../src/errors"
import { createUserAccessToken } from "../helpers/token.helper"
import { UpdateUserSchema } from "../../src/schema"
import { deleteAllUsersLike } from "../database/auth.database"
  
const updateUserUser = createTestUser({
	username: "Update_User_Test_User",
	email: "Update_user@test.com",
	firstName: "Update",
	lastName: "Userson",
	password: "test1234"
})

const updateUserUser2 = createTestUser({
	username: "Update_User_Test_User_2",
	email: "Update_user_2@test.com",
	firstName: "Update",
	lastName: "Userson II",
	password: "test1234"
})

describe("Update user", () => {
	beforeEach(async () => await deleteAllUsersLike("username", "Update_User_Test_User%"))
	afterAll(async () => {
		await deleteAllUsersLike("username", "Update_User_Test_User%")
	})

	it("Successfully updates a user", async () => {
		const user = await createUser(updateUserUser.createArgs)
		const token = await createUserAccessToken(user)

		const updateProps: UpdateUserSchema = {
			firstName: "New Update"
		}

		await apiSuccessTest({
			apiPromise: APIHelpers.updateUser(user.id, updateProps, token.token),
			apiDataGetter: (res) => res.data,
			matchArgs: {...updateUserUser.matchArgs, ...updateProps}
		})
	})

	it("Errors when unauthenticated", async () => {
		const user = await createUser(updateUserUser.createArgs)
		
		const updateProps: UpdateUserSchema = {
			firstName: "New Update"
		}

		await apiAuthenticationTest({
			apiPromise: (token) => APIHelpers.updateUser(user.id, updateProps, token),
			userId: user.id,
			userRole: user.userRole,
			permissions: user.permissions
		})
	})

	it("Errors when authenticated to the wrong user", async () => {
		const user1 = await createUser(updateUserUser.createArgs)
		const user2 = await createUser(updateUserUser2.createArgs)

		const token = await createUserAccessToken(user2)

		const updateProps: UpdateUserSchema = {
			firstName: "New Update"
		}

		await apiErrorTest(
			APIHelpers.updateUser(user1.id, updateProps, token.token),
			AuthError.InvalidPermissions
		)

	})
})