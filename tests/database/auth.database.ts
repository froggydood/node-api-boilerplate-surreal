import { HTTPError, DatabaseError } from "../../src/errors"
import { DB } from "../../src/types"
import { hash, omit } from "../helpers"
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
	const user = await db.selectFrom("user")
		.selectAll()
		.where(filter, "=", filterValue as any)
		.executeTakeFirst()
		.catch(() => {throw new HTTPError(DatabaseError.QueryError)})

	if (!user) throw new HTTPError(DatabaseError.UserNotFound)

	return user
}

export const deleteAllTestUsers = async (): Promise<void> => {
	await db.deleteFrom("user")
		.where("username", "like", "api_test_user%")
		.execute()
}

export const deleteAllUsersLike = async <K extends keyof DB.User>(likeField: K, likeStr: DB.User[K]): Promise<void> => {
	await db.deleteFrom("user")
		.where(likeField, "like", likeStr as any)
		.execute()
}

export const deleteAllUsersWithIDs = async (idArr: `user:${string}`[]): Promise<void> => {
	await db.deleteFrom("user")
		.where("id", "in", idArr)
		.execute()
}

export const createUser = async (
	userArgs: Omit<DB.InsertArgs<DB.DB_User>, "passwordHash"> & {password: string}
): Promise<DB.User> => {
	const passwordHash = await hash(userArgs.password)

	const user = db.insertInto("user")
		.values({
			...omit(userArgs, ["password"]),
			passwordHash
		})
		.returningAll()
		.executeTakeFirstOrThrow()
	
	return user
}
