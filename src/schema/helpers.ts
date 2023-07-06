import { z } from "zod"

export const getSchemaErrorMessage = (error: z.ZodError) => {
	return error.errors.map((error) => {
		const path = error.path.join(".")
		return path ? `Error with field "${path}": ${error.message}` : error.message
	}).join("\n")
}