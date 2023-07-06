import { SurrealDbHttpDialect, SurrealKysely } from "kysely-surrealdb"
import { fetch } from "undici"

import { DB } from "../../src/types"
import env from "../config/env"

const db = new SurrealKysely<DB.DB>({
	dialect: new SurrealDbHttpDialect({
		database: env.DB_DATABASE,
		fetch: (url, args) => {
			if (url.startsWith("https://")) url = url.replace("https://", "http://")
			return fetch(url, args)
		},
		hostname: `${env.DB_HOST}:${env.DB_PORT}`,
		namespace: env.DB_NAMESPACE,
		password: env.DB_PASSWORD,
		username: env.DB_USER,
	})
})

export default db