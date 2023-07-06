import { SurrealDatabase, SurrealDbHttpDialect, SurrealKysely } from "kysely-surrealdb"
import { fetch } from "undici"

import { DB } from "../types"
import { Kysely } from "kysely"
import { Surreal } from "surrealdb.js"

const db = new SurrealKysely<DB.DB>({
	dialect: new SurrealDbHttpDialect({
		database: process.env.DB_DATABASE,
		fetch: (url, args) => {
			if (url.startsWith("https://")) url = url.replace("https://", "http://")
			return fetch(url, args)
		},
		hostname: `${process.env.DB_HOST}:${process.env.DB_PORT}`,
		namespace: process.env.DB_NAMESPACE,
		password: process.env.DB_PASSWORD,
		username: process.env.DB_USER,

		
	})
})

// const db = new Surreal(`http://${process.env.DB_HOST}:${process.env.DB_PORT}/rpc`, {
// 	db: process.env.DB_DATABASE,
// 	ns: process.env.DB_NAMESPACE,
// 	auth: {
// 		user: process.env.DB_USER,
// 		pass: process.env.DB_PASSWORD,
// 	}
// })

export default db