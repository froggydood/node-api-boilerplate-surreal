export type CaughtPromise<T, E> = {
	success: false,
	error: E,
	data: undefined
} | {
	success: true,
	error: null,
	data: T
}

export const catchErrors = async <T, E>(promise: Promise<T>): Promise<CaughtPromise<T, E>> => {
	let error: E | null = null
	const res = await promise.catch((err) => error = err)
	if (error) {
		return {
			success: false,
			error,
			data: undefined
		}
	}
	return {
		success: true,
		error: null,
		data: res
	}
}

export const wait = (timeMs: number): Promise<void> => {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve()
		}, timeMs)
	})
}