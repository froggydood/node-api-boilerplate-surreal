import { createTestUser } from "../data/api"
import { createUser } from "../database/auth.database"
import { apiSuccessTest, checkObjMatchExclusive, getApiUser, omit } from "../helpers"
import { createUserAccessToken } from "../helpers/token.helper"
import { DB } from "../../src/types"
import { deleteAllUsersLike } from "../database/auth.database"
  
const getUserUser = createTestUser({
	username: "Get_User_Test_User",
	email: "get_user@test.com",
	firstName: "Get",
	lastName: "Userson",
	password: "test1234"
})

const getUserUser2 = createTestUser({
	username: "Get_User_Test_User_2",
	email: "get_user_2@test.com",
	firstName: "Get",
	lastName: "Userson II",
	password: "test1234"
})

describe("Get user", () => {
	beforeEach(async () => await deleteAllUsersLike("username", "Get_User_Test_User%"))
	afterAll(async () => {
		await deleteAllUsersLike("username", "Get_User_Test_User%")
	})

	it("Successfully gets user", async () => {
		const user = await createUser(getUserUser.createArgs)
		const token = await createUserAccessToken(user)

		await apiSuccessTest({
			apiPromise: getApiUser(user.userId, token.token),
			apiDataGetter: (res) => res.data,
			matchArgs: getUserUser.matchArgs
		})
	})

	it("Gives limited information when accessing from different user", async () => {
		const user1 = await createUser(getUserUser.createArgs)
		const user2 = await createUser(getUserUser2.createArgs)

		const token1 = await createUserAccessToken(user1)
		const token2 = await createUserAccessToken(user2)

		await apiSuccessTest({
			apiPromise: getApiUser(user1.userId, token1.token),
			apiDataGetter: (res) => res.data,
			matchArgs: getUserUser.matchArgs
		})

		const otherUserRes = await apiSuccessTest({
			apiPromise: getApiUser(user1.userId, token2.token)
		})

		checkObjMatchExclusive(
			omit(otherUserRes.data, ["userId"]),
			getUserUser.otherMatchArgs
		)
	})

	it("Gives limited information when accessing from no user", async () => {
		const user1 = await createUser(getUserUser.createArgs)

		const otherUserRes = await apiSuccessTest({
			apiPromise: getApiUser(user1.userId)
		})

		checkObjMatchExclusive(
			omit(otherUserRes.data, ["userId"]),
			getUserUser.otherMatchArgs
		)
	})

	it("Gives full information when accessing from other user with permissions", async () => {
		const user = await createUser(getUserUser.createArgs)
		const token = await createUserAccessToken(user, {
			permissions: [DB.Permission.GetOtherUsers]
		})

		await apiSuccessTest({
			apiPromise: getApiUser(user.userId, token.token),
			apiDataGetter: (res) => res.data,
			matchArgs: getUserUser.matchArgs
		})
	})
})