import { Pool } from "pg"

const pool = new Pool({
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	port: Number.parseInt(process.env.DB_PORT || ""),
	host: process.env.DB_HOST,
	database: process.env.DB_DATABASE
})

export default pool