export const roundToNearest = (num: number, nearest: number): number => {
	const remainder = num % nearest
	const floor = Math.floor(num / nearest) * nearest
	if (remainder >= nearest / 2) return floor + nearest
	return floor
}