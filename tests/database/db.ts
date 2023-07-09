import Surreal from "surrealdb.js"
import env from "../config/env"
import redis from "../../src/redis/client"

const db = new Surreal(`http://${env.DB_HOST}:${env.DB_PORT}/rpc`, {
	db: env.DB_DATABASE,
	ns: env.DB_NAMESPACE,
	auth: {
		user: env.DB_USER,
		pass: env.DB_PASSWORD,
	}
})

export default db

afterAll(async () => {
	await db.close()
	await redis.quit()
})