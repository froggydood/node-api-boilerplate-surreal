import app from "./app"
import env from "./env"
import logger from "koa-logger"
import json from "koa-json"

import bodyParser from "koa-body"

import router from "./routes"
import limiterMiddleware from "./middleware/rate-limit.middleware"

app.use(logger())
app.use(json())
app.use(bodyParser())
app.use(router.getMiddleware())
app.use(limiterMiddleware({
	maxRequests: env.RATE_LIMIT_MAX,
	windowMs: env.RATE_LIMIT_WINDOW_MS
}))

app.listen(env.API_PORT, () => {
	console.log(`Listening on port ${env.API_PORT}`)
})