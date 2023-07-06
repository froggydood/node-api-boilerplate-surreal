import Router from "../middleware/router.middleware"
import v1Router from "./v1"
import env from "../env"

const router = new Router()

router.nest(`${env.API_BASE_PATH || ""}/v1`, v1Router)

export default router