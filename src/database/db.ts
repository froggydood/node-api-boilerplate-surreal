import Surreal from "surrealdb.js"

const db = new Surreal(`http://${process.env.DB_HOST}:${process.env.DB_PORT}/rpc`, {
	db: process.env.DB_DATABASE,
	ns: process.env.DB_NAMESPACE,
	auth: {
		user: process.env.DB_USER,
		pass: process.env.DB_PASSWORD,
	}
})

export default db