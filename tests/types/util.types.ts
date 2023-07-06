export type MapValues<
	R extends Record<string | number | symbol, any>,
	V
> = {
	[key in keyof R]: V
}