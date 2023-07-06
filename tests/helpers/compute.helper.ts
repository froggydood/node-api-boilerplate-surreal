import env from "../config/env"
import argon2 from "argon2"

const saltBuffer = Buffer.from(env.HASH_SALT || "")

export const hash = async (data: string): Promise<string> => {
	const hashData = await argon2.hash(data, {salt: saltBuffer})

	return hashData
}

export const checkHash = async (checkData: string, hashedData: string): Promise<boolean> => {
	const valid = await argon2.verify(hashedData, checkData)

	return valid
}