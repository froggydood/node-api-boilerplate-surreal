import { HTTPError, AuthError } from "../errors"
import { handleError } from "../helpers"
import { client } from "../redis"
import { RouterMiddleware } from "./router.middleware"
import env from "../env"

export interface IRateLimitConfig {
	windowMs: number,
	maxRequests: number,
}

const getRedisKey = (ip: string, config: IRateLimitConfig): string => {
	// const frame = Math.floor(roundToNearest(new Date().getMinutes() * 60 * 1000, config.windowMs) / config.windowMs)
	return `IP-${ip}`
}

const limiterMiddleware = (config: IRateLimitConfig): RouterMiddleware => {
	return async (ctx, next) => {
		const devIp = Array.isArray(ctx.request.headers["x-ip"]) ? ctx.request.headers["x-ip"][0] : ctx.request.headers["x-ip"]
		const ip: string = env.NODE_ENV === "dev" ? (devIp || ctx.request.ip) : ctx.request.ip
		const redisKey = getRedisKey(ip, config)

		const multi = client.multi()
		multi.incr(redisKey)
		multi.expire(redisKey, config.windowMs / 1000)
		const [ count ] = await multi.exec()

		if (count && (count as number) > config.maxRequests) {
			await handleError(ctx, new HTTPError(AuthError.TooManyRequests))
			return
		}
		
		await next()
	}
}

export default limiterMiddleware