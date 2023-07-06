import Router from "../../middleware/router.middleware"
import authRouter from "./auth.route"
import userRouter from "./user.route"

const router = new Router()

router.nest("/auth", authRouter)
router.nest("/user", userRouter)
router.get("/ping", async (ctx) => {
	ctx.body = "PONG"
})

export default router