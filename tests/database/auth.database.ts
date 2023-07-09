import { DB } from "../../src/types"
import { hash, formatID, isDateExpired } from "../helpers"
import authConfig from "../../src/config/auth.config"
import { RegisterRequestSchema } from "../../src/schema"
import { HTTPError, AuthError, DatabaseError } from "../../src/errors"
import db from "./db"
import { generateSetStatement, handleDBError, handleDBQuery } from "../../src/database/sql.helper"

export const updateUserById = async (
	id: string,
	updateData: Partial<DB.User>,
): Promise<DB.User> => {
	const setStatement = generateSetStatement(updateData)
	const users = await handleDBQuery<[DB.User[]], "first">(
		db.query(`UPDATE $id SET ${setStatement.sql} RETURN after`, {
			...setStatement.values,
			id: formatID("user", id)
		}),
		"first"
	)
	const user = users[0]

	if (!user) throw new HTTPError(DatabaseError.UserNotFound)
	
	return user
}

export const updateUser = async <K extends keyof DB.User>(
	filterKey: K,
	filterValue: DB.User[K],
	updateData: Partial<DB.User>,
): Promise<DB.User> => {
	const setStatement = generateSetStatement(updateData)
	const users = await handleDBQuery<[DB.User[]], "first">(
		db.query(`UPDATE user SET ${setStatement.sql} WHERE ${filterKey} = $filter RETURN after`, {
			...setStatement.values,
			filter: filterValue
		}),
		"first"
	)

	const user = users[0]
	if (!user) throw new HTTPError(DatabaseError.UserNotFound)
	
	return user
}

export const getUserById = async (
	id: string
): Promise<DB.User> => {
	const users = await handleDBQuery<[DB.User[]], "first">(
		db.query(`SELECT * FROM $id`, {id: formatID("user", id)}),
		"first"
	)
	const user = users[0]
	if (!user) throw new HTTPError(DatabaseError.UserNotFound)

	return user
}

export const getUser = async <K extends keyof DB.User>(
	filter: K,
	filterValue: DB.User[K]
): Promise<DB.User> => {
	const users = await handleDBQuery(
		db.query<DB.User[]>(`SELECT * FROM user WHERE ${filter} = $filter`, {filter: filterValue}),
		"first"
	)

	const user = users[0]
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

	const newUsers = await handleDBQuery<[DB.User[]], "first">(
		db.query(`UPDATE $id SET passwordHash=$newHash WHERE passwordHash=$oldHash RETURN AFTER`, {id: formatID("user", userId), newHash, oldHash}),
		"first"
	)
	const newUser = newUsers[0]
	if (!newUser) throw new HTTPError(AuthError.PasswordsDontMatch)

	return newUser
}

export const createUser = async (userArgs: RegisterRequestSchema & Partial<DB.User>): Promise<DB.User> => {
	const existingUsers = await handleDBQuery<[DB.User[]], "first">(
		db.query(`SELECT email, username FROM user WHERE email = $email OR username = $username`, {
			email: userArgs.email,
			username: userArgs.username
		}),
		"first"
	)
	const existingUser = existingUsers[0]

	if (existingUser) {
		if (existingUser.email === userArgs.email) throw new HTTPError(AuthError.EmailAlreadyExists)
		if (existingUser.username === userArgs.username) throw new HTTPError(AuthError.UsernameAlreadyExists)
	}

	const passwordHash = await hash(userArgs.password)
	
	const setStatement = generateSetStatement({
		email: userArgs.email,
		firstName: userArgs.firstName,
		lastName: userArgs.lastName,
		passwordHash,
		username: userArgs.username,
	})
	const users = await handleDBQuery<[DB.User[]], "first">(
		db.query(`CREATE user SET ${setStatement.sql} RETURN after`, setStatement.values),
		"first"
	)
	const user = users[0]
	if (!user) throw new HTTPError(DatabaseError.UserNotFound)

	return user
}

export const verifyUser = async (tokenStr: string): Promise<DB.User> => {
	const res = await handleDBQuery<[(DB.UserToken & {user: DB.User})[]], "first">(
		db.query(
			`SELECT (<-hasToken.in)[0].* as user, * FROM $veriToken WHERE type="verification";`, {veriToken: formatID("userToken", tokenStr)}
		), "first"
	)

	if (!res[0]) throw new HTTPError(DatabaseError.UserNotFound)
	const { user, ...token } = res[0]
	
	if (isDateExpired(token.createdAt, authConfig.verificationTimeoutMins)) throw new HTTPError(AuthError.ExpiredVerificationToken)
	if (user.verified) throw new HTTPError(AuthError.UserAlreadyVerified)

	const newUser = await updateUserById(user.id, {verified: true})
	if (!newUser) {throw new HTTPError(DatabaseError.UserNotFound)}

	return newUser
}

export const deleteUserById = async (
	id: string
): Promise<void> => {
	const res = await db.delete(formatID("user", id))
		.catch(handleDBError())
	if (res.length === 0) {throw new HTTPError(DatabaseError.UserNotFound)}
}

export const createUserToken = async (
	args: {type: DB.TokenType, userId: string, expiresAt: Date}
): Promise<DB.UserToken> => {
	const res = await handleDBQuery<[null, DB.HasToken, DB.UserToken[]], "last">(
		db.query(`
			BEGIN TRANSACTION;

			LET $newToken = CREATE userToken:uuid() SET type=$tokenType ${args.expiresAt ? ", expiresAt=$expiresAt" : ""} RETURN after;

			RELATE $userId->hasToken->($newToken.id);

			SELECT * FROM $newToken;

			COMMIT TRANSACTION;
		`, {
			tokenType: args.type,
			userId: formatID("user", args.userId),
			expiresAt: args.expiresAt
		}),
		"last"
	)
	const token = res[0]
	if (!token) throw new HTTPError(DatabaseError.QueryError)
	return token
}

export const deleteUserToken = async (id: string): Promise<void> => {
	const res = await db.delete(formatID("userToken", id))
	if (res.length === 0) throw new HTTPError(DatabaseError.NotFound)
}

export const recreateUserToken = async (userId: string, args: {type: DB.TokenType}): Promise<DB.UserToken> => {
	const res = await handleDBQuery<[null, null, DB.HasToken, DB.UserToken], "last">(
		db.query(`
			BEGIN TRANSACTION;

			DELETE FROM userToken WHERE (<-hasToken.in)[0] = $userId AND type=$tokenType);
			
			LET $newToken = CREATE userToken:uuid() SET type=$tokenType RETURN after;
			
			RELATE $userId->hasToken->($newToken.id);
			
			SELECT * FROM $newToken;
			
			COMMIT TRANSACTION;
		`, {
			tokenType: args.type,
			userId: formatID("user", userId),
		}),
		"last"
	)
	const token = res[0]
	if (!token) throw new HTTPError(DatabaseError.QueryError)

	return token
}

export const recreateUserTokenFromEmail = async (email: string, args: {type: DB.TokenType}): Promise<DB.UserToken> => {
	const res = await handleDBQuery<[null, null, null, DB.HasToken, DB.UserToken], "last">(
		db.query(`
			BEGIN TRANSACTION;

			LET $user = SELECT * FROM user WHERE email=$email;

			DELETE FROM userToken WHERE (<-hasToken.in)[0].email = $email AND type=$tokenType);
			
			LET $newToken = CREATE userToken:uuid() SET type=$tokenType RETURN after;
			
			RELATE ($user.id)->hasToken->($newToken.id);
			
			SELECT * FROM $newToken;
			
			COMMIT TRANSACTION;
		`, {
			tokenType: args.type,
			email,
		}),
		"last"
	)

	const token = res[0]
	if (!token) throw new HTTPError(DatabaseError.QueryError)
	return token
}

export const getUserAndTokenFromTokenId = async (args: {
	tokenId: string,
	tokenType: DB.TokenType,
}): Promise<{user: DB.User} & DB.UserToken> => {
	const res = await handleDBQuery<[({user: DB.User} & DB.UserToken)[]], "first">(
		db.query(`
			SELECT (<-hasToken.in)[0].* as user, * FROM $tokenId WHERE type = $tokenType;
		`, {
			tokenType: args.tokenType,
			tokenId: formatID("userToken", args.tokenId),
		}), "first"
	)
	const item = res[0]
	if (!item) throw new HTTPError(DatabaseError.UserNotFound)
	return item
}

export const getUserTokens = async (args: {
	userId: string,
	tokenType: DB.TokenType,
}): Promise<DB.UserToken[]> => {
	const tokens = await handleDBQuery<[DB.UserToken[]], "first">(
		db.query(`
			SELECT * FROM userToken WHERE type = $tokenType AND (<-hasToken.in)[0] = $userId;
		`, {
			tokenType: args.tokenType,
			userId: formatID("user", args.userId),
		}), "first"
	)
	if (!tokens) throw new HTTPError(DatabaseError.NotFound)
	return tokens
}

export const deleteAllUsersLike = async (key: keyof DB.User, likeValue: string): Promise<void> => {
	await handleDBQuery<[null], "first">(
		db.query(
			`DELETE FROM user WHERE ${key} = type::regex($regex)`,
			{regex: likeValue.replace(/%/g, ".*")}
		),
		"first"
	)
}