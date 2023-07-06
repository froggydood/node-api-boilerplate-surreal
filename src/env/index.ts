import dotenv from "dotenv"
import dotenvParseVariables from "dotenv-parse-variables"
import { EnvVariables } from "../types"

const prevVars = process.env as unknown as EnvVariables

const envVars = dotenv.config({path: ".env"})

const totalEnv: EnvVariables = {
	...(envVars.parsed ? dotenvParseVariables(envVars.parsed) : {}),
	...prevVars
} as unknown as EnvVariables

process.env = {
	...process.env,
	...totalEnv
} as unknown as NodeJS.ProcessEnv

export default totalEnv