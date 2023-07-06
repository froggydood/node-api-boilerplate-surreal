import { hash } from "../helpers/compute.helper"
import { DB } from "../types"
import { isDateExpired } from "../helpers"
import authConfig from "../config/auth.config"
import { RegisterRequestSchema } from "../schema"
import { HTTPError, AuthError, DatabaseError } from "../errors"
import db from "./db"

export const updateUserById = async (
	id: string,
	updateData: Partial<DB.User>,
): Promise<DB.User> => {
	const user = await db.updateTable(`user:${id}`)
		.set(updateData)
		.returningAll()
		.executeTakeFirst()
		.catch(() => {throw new HTTPError(DatabaseError.QueryError)})

	if (!user) throw new HTTPError(DatabaseError.UserNotFound)
	
	return user
}

export const updateUser = async <K extends keyof DB.User>(
	filterKey: K,
	filterValue: DB.User[K],
	updateData: Partial<DB.User>,
): Promise<DB.User> => {
	const user = await db.updateTable("user")
		.where(filterKey, "=", filterValue as any)
		.set(updateData)
		.returningAll()
		.executeTakeFirst()
		.catch(() => {throw new HTTPError(DatabaseError.QueryError)})

	if (!user) throw new HTTPError(DatabaseError.UserNotFound)
	
	return user
}

export const getUserById = async (
	id: string
): Promise<DB.User> => {
	const user = await db.selectFrom(`user:${id}`)
		.selectAll()
		.executeTakeFirst()
		.catch(() => {throw new HTTPError(DatabaseError.QueryError)})

	if (!user) throw new HTTPError(DatabaseError.UserNotFound)

	return user
}

export const getUser = async <K extends keyof DB.User>(
	filter: K,
	filterValue: DB.User[K]
): Promise<DB.User> => {
	const query = db.selectFrom("user")
		.selectAll()
		.where(filter, "=", filterValue as any)

	const user = await query
		.executeTakeFirst()
		.catch(() => {throw new HTTPError(DatabaseError.QueryError)})

	if (!user) throw new HTTPError(DatabaseError.UserNotFound)

	return user
}

export const updateUserPassword = async (
	userId: string,
	oldPassword: string,
	newPassword: string
): Promise<DB.User> => {
	const oldHash = await hash(oldPassword)
	const newHash = await hash(newPassword)

	const newUser = await db.updateTable(`user:${userId}`)
		.where("passwordHash", "=", oldHash)
		.set({passwordHash: newHash})
		.returningAll()
		.executeTakeFirst()
		.catch(() => {throw new HTTPError(DatabaseError.QueryError)})
	
	if (!newUser) throw new HTTPError(AuthError.PasswordsDontMatch)

	return newUser
}

export type CreateUserArgs = RegisterRequestSchema & {
	userId: string
}

export const createUser = async (userArgs: CreateUserArgs & Partial<DB.User>): Promise<DB.User> => {
	const existingUser = await db.selectFrom("user")
		.select(["email", "username"])
		.where(({or, cmpr}) => or([
			cmpr("email", "=", userArgs.email),
			cmpr("username", "=", userArgs.username),
		]))
		.executeTakeFirst()
		.catch((err) => {
			console.error(err)
			throw new HTTPError(DatabaseError.QueryError)
		})

	if (existingUser) {
		if (existingUser.email === userArgs.email) throw new HTTPError(AuthError.EmailAlreadyExists)
		if (existingUser.username === userArgs.username) throw new HTTPError(AuthError.UsernameAlreadyExists)
	}

	const passwordHash = await hash(userArgs.password)

	const user = await db.create("user")
		.set({
			id: userArgs.userId,
			email: userArgs.email,
			firstName: userArgs.firstName,
			lastName: userArgs.lastName,
			passwordHash,
			username: userArgs.username,
			verificationToken: userArgs.verificationToken,
			verificationTokenGeneratedAt: userArgs.verificationTokenGeneratedAt,
			passwordResetToken: userArgs.passwordResetToken,
			passwordResetTokenGeneratedAt: userArgs.passwordResetTokenGeneratedAt
		})
		.return("after")
		.executeTakeFirstOrThrow()
		.catch((err) => {
			console.error(err)
			throw new HTTPError(DatabaseError.QueryError)
		})

	return user as unknown as DB.User
}

export const verifyUser = async (token: string): Promise<DB.User> => {
	const user = await db.selectFrom("user")
		.select(["verified", "id", "verificationTokenGeneratedAt"])
		.where("verificationToken", "=", token)
		.executeTakeFirst()

	if (!user) throw new HTTPError(DatabaseError.UserNotFound)
	
	if (!user.verificationTokenGeneratedAt || isDateExpired(user.verificationTokenGeneratedAt, authConfig.verificationTimeoutMins)) throw new HTTPError(AuthError.ExpiredVerificationToken)
	if (user.verified) throw new HTTPError(AuthError.UserAlreadyVerified)

	const newUser = await db.updateTable(`user:${user.id}`)
		.set({verified: true})
		.returningAll()
		.executeTakeFirst()

	if (!newUser) {throw new HTTPError(DatabaseError.UserNotFound)}

	return newUser
}

export const deleteUserById = async (
	id: string
): Promise<void> => {
	const res = await db.deleteFrom(`user:${id}`)
		.executeTakeFirst()

	if (res.numDeletedRows === 0n) {throw new HTTPError(DatabaseError.UserNotFound)}
}