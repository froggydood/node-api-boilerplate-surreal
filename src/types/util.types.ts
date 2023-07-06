export type ArrayPick<
	T extends Record<string, any>,
	A extends (keyof T)[] | undefined
> = A extends undefined ? T : A extends never[] ? T : {
	[key in A[any]]: T[key]
}