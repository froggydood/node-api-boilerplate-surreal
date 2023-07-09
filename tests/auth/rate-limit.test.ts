import { AuthError } from "../../src/errors"
import env from "../config/env"
import { createTestUser } from "../data/api"
import { createUser } from "../database/auth.database"
import { APIHelpers, apiBatchTest, expectError, wait } from "../helpers"
import { deleteAllUsersLike } from "../database/auth.database"

const rateLimitUser = createTestUser({
	username: "Rate_Limit_Test_User",
	email: "rate-limit@test.com",
	firstName: "Rate",
	lastName: "Limiter",
	password: "test1234"
})

const expiryTime = env.RATE_LIMIT_WINDOW_MS * 2

describe("Refresh token", () => {
	beforeAll(async () => {
		await deleteAllUsersLike("username", "Rate_Limit_Test_User%")
		await createUser(rateLimitUser.createArgs)
		
	})
	afterAll(async () => {
		await deleteAllUsersLike("username", "Rate_Limit_Test_User%")
	})

	it("Should allow requests equal to the max requests", async () => {
		const testIP = "TEST.IP.FOR.TESTING.1" + Date.now()
		await apiBatchTest({
			apiPromiseGetter: () => APIHelpers.login(rateLimitUser.loginArgs, {headers: {"X-IP": testIP}}),
			errorCB: () => {throw "Request errored"},
			numRequests: env.RATE_LIMIT_MAX
		})
	}, expiryTime)

	it("Should allow requests equal to the max requests, within the given window time", async () => {
		const testIP = "TEST.IP.FOR.TESTING.2" + Date.now()
		await apiBatchTest({
			apiPromiseGetter: () => APIHelpers.login(rateLimitUser.loginArgs, {headers: {"X-IP": testIP}}),
			errorCB: () => {throw "Request errored"},
			numRequests: env.RATE_LIMIT_MAX
		})
		await wait(env.RATE_LIMIT_WINDOW_MS + 100)

		await apiBatchTest({
			apiPromiseGetter: () => APIHelpers.login(rateLimitUser.loginArgs, {headers: {"X-IP": testIP}}),
			errorCB: () => {throw "Request errored"},
			numRequests: env.RATE_LIMIT_MAX
		})
	}, expiryTime)
	
	
	it("Should disallow requests above the max requests", async () => {
		const testIP = "TEST.IP.FOR.TESTING.3" + Date.now()
		await apiBatchTest({
			apiPromiseGetter: () => APIHelpers.login(rateLimitUser.loginArgs, {headers: {"X-IP": testIP}}),
			successCB: (num, res) => {
				if (num > env.RATE_LIMIT_MAX) {
					throw "Request was successful after rate limit exceeded"
				}
			},
			errorCB: (num, res) => {
				if (num <= env.RATE_LIMIT_MAX) {
					throw "Errored before limit"
				}
				expectError(res, AuthError.TooManyRequests)
			},
			numRequests: env.RATE_LIMIT_MAX + 20
		})
	}, expiryTime)
})