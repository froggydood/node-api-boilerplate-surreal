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
	return filterIDObject(pick(user, [
		"id", "userRole", "username", "firstName", "lastName", "email",
		"joinedAt", "verified"
	]))
}

export const filterOtherUser = (user: DB.User) => {
	return filterIDObject(pick(user, [
		"id", "username", "joinedAt", "verified"
	]))
}

export const filterID = (id: string): string => {
	if (!id.includes(":")) return id
	id = id.split(":")[1]
	id = id.replace(/[⟨⟩`]/g, "")
	return id
}

export const formatID = <T extends string>(table: T, id: string): `${T}:${string}` => {
	id = filterID(id)
	if (/[-@:#.,]/.test(id)) id = `⟨${id}⟩`
	return `${table}:${id}`
}

export const filterIDObject = <T extends {id: string}>(obj: T): T => {
	return {
		...obj,
		id: filterID(obj.id)
	}
}