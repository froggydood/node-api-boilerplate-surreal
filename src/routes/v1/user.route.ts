import Router from "../../middleware/router.middleware"
import { handleRequest } from "../../helpers"
import { updateUserSchema } from "../../schema"
import { getUserHandler, updateUserHandler } from "../../services/user.service"

const router = new Router()

router.get("/:userId", async (ctx) => {
	await handleRequest({
		ctx, handler: getUserHandler,
		getAuthentication: true
	})
})

router.patch("/:userId", async (ctx) => {
	await handleRequest({
		ctx, handler: updateUserHandler,
		schema: updateUserSchema,
		authenticate: true
	})
})

export default router