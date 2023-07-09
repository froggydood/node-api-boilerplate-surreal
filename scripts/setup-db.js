const { default: Surreal } = require("surrealdb.js");
const dotenv = require("dotenv");
const fs = require("fs")
const { fetch } = require("undici")
const path = require("path")
const oldEnv = process.env
const newEnv = dotenv.parse(fs.readFileSync(path.join(__dirname, "..", ".env")));
process.env = { ...newEnv, ...oldEnv }

const db = new Surreal(`http://${process.env.DB_HOST}:${process.env.DB_PORT}/rpc`, {
	auth: {
		user: process.env.DB_USER,
		pass: process.env.DB_PASSWORD
	},
	db: process.env.DB_DATABASE,
	ns: process.env.DB_NAMESPACE,
});

(async () => {
	await db.query(`DEFINE NS ${process.env.DB_NAMESPACE}`)
	await db.use({ns: process.env.DB_NAMESPACE})
	await db.query(`DEFINE DATABASE ${process.env.DB_DATABASE}`)
	await db.use({db: process.env.DB_DATABASE})
	await db.query(`DEFINE TABLE _surrealx_migrations`)
	process.exit(0)
})()