import { HTTPError, ComputeError } from "../errors"
import argon2 from "argon2"

const saltBuffer = Buffer.from(process.env.HASH_SALT || "")

export const hash = async (data: string): Promise<string> => {
	const hashData = await argon2.hash(data, {salt: saltBuffer})
		.catch(() => {throw new HTTPError(ComputeError.HashFailed)})

	return hashData
}

export const checkHash = async (checkData: string, hashedData: string): Promise<boolean> => {
	const valid = await argon2.verify(hashedData, checkData, {salt: saltBuffer})

	return valid
}