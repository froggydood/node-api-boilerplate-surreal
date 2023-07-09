import { RegisterRequestSchema } from "../../src/schema"
import { DB } from "../../src/types"
import { omit } from "../helpers"
import { createUser } from "../database/auth.database"

export interface MatchArgs {
	email?: string,
	firstName?: string,
	lastName?: string,
	username?: string,
	userRole?: string,
	verified?: boolean,
	permissions?: string[],
	joinedAt?: RegExp
}

export interface OtherMatchArgs {
	username?: string,
	userRole?: string,
	verified?: boolean,
	joinedAt?: RegExp
}

export type UserData = {
	registerArgs: RegisterRequestSchema,
	createArgs: Parameters<typeof createUser>[0]
	matchArgs: MatchArgs,
	otherMatchArgs: OtherMatchArgs,
	loginArgs: {
		email: string,
		password: string
	}
}

export const tokenMatchData = {
	expiresAt: expect.any(Number),
	token: expect.any(String)
}

export const tokensMatchData = {
	access: tokenMatchData,
	refresh: tokenMatchData
}

const isoTimeRegexp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z$/

export const userTokenMatchData = {
	createdAt: isoTimeRegexp,
	id: expect.any(String),
	type: expect.any(String)
}

export const createTestUser = (
	args: RegisterRequestSchema,
	matchArgs: Omit<Partial<DB.User>, "joinedAt"> & {joinedAt?: RegExp} = {
		verified: false,
		joinedAt: isoTimeRegexp
	},
): UserData => {
	return {
		createArgs: {...args},
		registerArgs: args,
		matchArgs: {
			...omit(args, ["password"]),
			...matchArgs
		} as MatchArgs,
		loginArgs: {
			email: args.email,
			password: args.password
		},
		otherMatchArgs: {
			...omit(args, ["email", "firstName", "lastName", "password"]),
			...matchArgs
		}
	}
}

export const user1: UserData = createTestUser({
	email: "test.test@test.com",
	firstName: "John",
	lastName: "Doe",
	password: "1234test",
	username: "api_test_user"
})

export const sameEmailUser: UserData = createTestUser({
	email: "test.test@test.com",
	firstName: "Johnny",
	lastName: "Doey",
	password: "1234test",
	username: "api_test_user_2"
})

export const sameUsernameUser: UserData = createTestUser({
	email: "test2.test@moretest.com",
	firstName: "Fergus",
	lastName: "Armstrong",
	password: "1234test",
	username: "api_test_user"
})