import formidable from "formidable"
import Application from "koa"
import path from "path"
import fs from "fs"
import { HTTPError, ValidationError } from "../errors"
import { handleError } from "../helpers"


const formMiddleware = (options: formidable.Options = {}): Application.Middleware => {
	const uploadDir = path.join(__dirname, "..", "files")
	console.log("UPLOAD", uploadDir)
	if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir)

	return async (ctx, next) => {
		if (!ctx.request.header["content-type"]?.startsWith("multipart/form-data")) return await next()

		const form = formidable({
			allowEmptyFiles: false,
			uploadDir,
			...options 
		})
		let error: boolean | HTTPError = false
		await new Promise<void>((resolve, reject) => {
			form.parse(ctx.req, (err, fields, files) => {
				if (err) {
					console.log("FORM ERROR", err)
					return reject(err)
				}
				ctx.request.body = fields
				ctx.request.files = files
				resolve()
			})
		}).catch((err) => error = new HTTPError(ValidationError.InvalidData, "Form data formatted incorrectly"))
		if (error) {
			return await handleError(ctx, error)
		}

		await next()
	}
}

export default formMiddleware