import Application, { DefaultContext, DefaultState, ParameterizedContext } from "koa"

export type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS" | "CONNECT"

export type RouterContext = ParameterizedContext<DefaultState, DefaultContext, any> & {
	params: Record<string, string>
}

export type RouterMiddleware = (
	ctx: RouterContext,
	next: () => Promise<void>
) => Promise<any>;

export interface Route {
	methods: RequestMethod[],
	allMethods: boolean,
	path: string,
	callback: RouterMiddleware
}

export interface RouterMatch {
	router: Router,
	path: string
}

const getPathComponents = (path: string) => {
	return path.split("/").filter((currPath) => currPath !== "")
}

const getRouteParams = (basePath: string, path: string): Record<string, string> => {
	const baseComponents = getPathComponents(basePath)
	const pathComponents = getPathComponents(path)

	const params: Record<string, string> = {}
	baseComponents.forEach((baseComponent, i) => {
		const pathComponent = pathComponents[i]
		if (baseComponent.startsWith(":")) params[baseComponent.substring(1)] = pathComponent
	})

	return params
}

const pathExtends = (basePath: string, path: string): boolean => {
	const baseComponents = getPathComponents(basePath)
	const pathComponents = getPathComponents(path)

	const invalid = baseComponents.filter((baseComponent, i) => {
		const pathComponent = pathComponents[i]
		if (pathComponent !== baseComponent && !baseComponent.startsWith(":")) return true
		return false
	})

	return invalid.length === 0
}

const pathMatches = (basePath: string, path: string) => {
	const baseComponents = getPathComponents(basePath)
	const pathComponents = getPathComponents(path)
	if (baseComponents.length !== pathComponents.length) return false

	const invalid = baseComponents.filter((baseComponent, i) => {
		const pathComponent = pathComponents[i]
		if (pathComponent !== baseComponent && !baseComponent.startsWith(":")) return true
		return false
	})

	return invalid.length === 0
}

export default class Router {
	private routes: Route[]
	private routers: RouterMatch[]

	constructor() {
		this.routers = []
		this.routes = []
	}

	getMatchingRoute(ctx: Application.Context, basePath = ""): Route | undefined {
		const foundRoute = this.routes.find((route) => {
			if (!route.allMethods && !route.methods.includes(ctx.request.method.toUpperCase() as RequestMethod)) return false
			return pathMatches(basePath + route.path, ctx.path)
		})
		if (foundRoute) return {...foundRoute, path: basePath + foundRoute.path}

		const foundRouter = this.routers.find((router) => {
			return pathExtends(basePath + router.path, ctx.path)
		})
		if (foundRouter) return foundRouter.router.getMatchingRoute(ctx, basePath + foundRouter.path)

		return undefined
	}

	getMiddleware(): Application.Middleware {
		return async (ctx, next) => {
			const matchingRoute = this.getMatchingRoute(ctx)
			if (!matchingRoute) return await next()
			ctx.params = getRouteParams(matchingRoute.path, ctx.path)
			await matchingRoute.callback(ctx as RouterContext, next)
		}
	}

	private combineCallbacks(callbacks: RouterMiddleware[]): RouterMiddleware {
		const getCallback = (num = 0): RouterMiddleware => {
			if (num >= callbacks.length) return async () => {}
			return async (ctx) => {
				const next = () => getCallback(num+1)(ctx, async () => {})
				await callbacks[num](ctx, next)
			}
		}
		return async (ctx, next) => {
			await getCallback()(ctx, next)
			await next()
		}
	}

	private addRoute(method: RequestMethod, path: string, callbacks: RouterMiddleware[]) {
		this.routes.push({
			methods: [method],
			allMethods: false,
			path,
			callback: this.combineCallbacks(callbacks)
		})
	}

	nest(path: string, router: Router) {
		this.routers.push({
			path,
			router
		})
	}

	get(path: string, ...callbacks: RouterMiddleware[]) {this.addRoute("GET", path, callbacks)}
	post(path: string, ...callbacks: RouterMiddleware[]) {this.addRoute("POST", path, callbacks)}
	patch(path: string, ...callbacks: RouterMiddleware[]) {this.addRoute("PATCH", path, callbacks)}
	delete(path: string, ...callbacks: RouterMiddleware[]) {this.addRoute("DELETE", path, callbacks)}
	put(path: string, ...callbacks: RouterMiddleware[]) {this.addRoute("PUT", path, callbacks)}
	head(path: string, ...callbacks: RouterMiddleware[]) {this.addRoute("HEAD", path, callbacks)}
	options(path: string, ...callbacks: RouterMiddleware[]) {this.addRoute("OPTIONS", path, callbacks)}
	connect(path: string, ...callbacks: RouterMiddleware[]) {this.addRoute("CONNECT", path, callbacks)}
	
	all(path: string, ...callbacks: RouterMiddleware[]) {
		this.routes.push({
			methods: [],
			allMethods: true,
			path,
			callback: this.combineCallbacks(callbacks)
		})
	}

	add(method: RequestMethod | RequestMethod[], path: string, ...callbacks: RouterMiddleware[]) {
		this.routes.push({
			methods: Array.isArray(method) ? method : [method],
			allMethods: false,
			path,
			callback: this.combineCallbacks(callbacks)
		})
	}
}