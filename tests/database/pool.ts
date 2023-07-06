import env from "../config/env"
import { Pool } from "pg"

const pool = new Pool({
	user: env.DB_USER,
	host: env.DB_HOST,
	port: env.DB_PORT,
	database: env.DB_DATABASE,
	password: env.DB_PASSWORD
})

afterAll(() => {
	pool.end()
})

export default pool