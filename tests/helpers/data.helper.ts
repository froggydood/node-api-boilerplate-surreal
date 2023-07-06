import { readFileSync } from "fs"

export const pick = <T extends Record<string, any>, K extends keyof T>(
	obj: T,
	keys: K[]
): Pick<T, K> => {
	const newObj: Record<string, any> = {}
	Object.entries(obj).forEach(([key, value]) => {
		if (keys.includes(key as K)) newObj[key] = value
	})

	return newObj as Pick<T, K>
}

export const omit = <T extends Record<string, any>, K extends keyof T>(
	obj: T,
	keys: K[]
): Omit<T, K> => {
	const newObj: Record<string, any> = {}
	Object.entries(obj).forEach(([key, value]) => {
		if (!keys.includes(key as K)) newObj[key] = value
	})

	return newObj as Omit<T, K>
}


export type FilterUndefined<T extends Record<string, any>> = {
	[key in keyof T]: T[key] extends undefined ? never : T[key]
}

export const filterUndefined = <T extends Record<string, any>>(obj: T): FilterUndefined<T> => {
	return Object.entries(obj)
		.filter(([key, value]) => value !== undefined)
		.reduce((accu, [key, value]) =>
			({...accu, [key]: value}), {}
		) as FilterUndefined<T>
}

export const getImageB64 = (filePath: string): string => {
	return readFileSync(filePath, "base64")
}