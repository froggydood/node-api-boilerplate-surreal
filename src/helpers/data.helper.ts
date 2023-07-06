import { DB, API } from "../types"

export const pick = <
	T extends Record<string, any>,
	K extends keyof T
>(
	obj: T,
	keys: K[]
): Pick<T, K> => {
	const newObj: Record<string, any> = {}
	Object.entries(obj).forEach(([key, value]) => {
		if (keys.includes(key as K)) newObj[key] = value
	})

	return newObj as Pick<T, K>
}

export const omit = <
	T extends Record<string, any>,
	K extends keyof T
>(
	obj: T,
	keys: K[]
): Omit<T, K> => {
	const newObj: Record<string, any> = {}
	Object.entries(obj).forEach(([key, value]) => {
		if (!keys.includes(key as K)) newObj[key] = value
	})

	return newObj as Omit<T, K>
}

export const filterUser = (user: DB.User): API.User => {
	return pick(user, [
		"id", "userRole", "username", "firstName", "lastName", "email",
		"joinedAt", "verified"
	])
}

export const filterOtherUser = (user: DB.User) => {
	return pick(user, [
		"id", "username", "joinedAt", "verified"
	])
}