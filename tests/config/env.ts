import { EnvVariables } from "../../src/types"
import dotenv from "dotenv"
import dotenvParseVariables from "dotenv-parse-variables"

const env = dotenv.config({path: ".env"})

const prevVars = process.env as unknown as Record<keyof EnvVariables, string>

const envVars = dotenvParseVariables({
	...env.parsed,
	...prevVars
}) as unknown as EnvVariables

process.env = {
	...process.env,
	...envVars
} as unknown as NodeJS.ProcessEnv

export default envVars