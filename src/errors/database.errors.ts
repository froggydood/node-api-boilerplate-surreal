import { ErrorMap } from "./errors.types"

export enum DatabaseError {
	UserNotFound = 3000,
	QueryError,
	NotFound
}

export const databaseErrorMap: ErrorMap<DatabaseError> = {
	[DatabaseError.UserNotFound]: [404, "User not found"],
	[DatabaseError.QueryError]: [500, "Error with database query"],
	[DatabaseError.NotFound]: [404, "Item not found"]
}