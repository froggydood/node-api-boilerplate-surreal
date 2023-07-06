import env from "../env"
import { createClient } from "redis"

const client: ReturnType<typeof createClient> = createClient({
	url: `redis://${env.REDIS_USER}:${env.REDIS_PASSWORD}@${env.REDIS_HOST}:${env.REDIS_PORT}/${env.REDIS_DB_NUMBER}`
})

client.on("error", (err) => console.log("Redis client error", err))

client.connect()

export default client