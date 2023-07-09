export const wait = (timeMs: number): Promise<void> => {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve()
		}, timeMs)
	})
}