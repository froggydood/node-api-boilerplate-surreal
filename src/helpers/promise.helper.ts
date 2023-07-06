import fs from "fs"

export type HandledPromiseReturn<T, E = any> = {
	success: true,
	error: undefined,
	data: T
} | {
	success: false,
	error: E,
	data: undefined
}

export const catchErrors = <T, E = any>(promise: Promise<T>): Promise<HandledPromiseReturn<T>>  => {
	return new Promise(async (resolve, reject) => {
		let success = true
		const data = await promise.catch((err: E) => {
			success = false
			resolve({
				success,
				error: err,
				data: undefined
			})
		}) as T
		if (!success) return
		resolve({
			success: true,
			error: undefined,
			data
		})
	})
}

export const readFileAsync = (filePath: string): Promise<Buffer> => {
	return new Promise((resolve, reject) => {
		fs.readFile(filePath, (err, data) => {
			if (err) return reject(err)
			resolve(data)
		})
	})
}