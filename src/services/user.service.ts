import { getUser, getUserById, updateUser, updateUserById } from "../database/auth.database"
import { HTTPError, AuthError } from "../errors"
import { filterOtherUser, filterUser, Handler } from "../helpers"
import { UpdateUserSchema } from "../schema"
import { DB } from "../types"

export const getUserHandler: Handler<null> = async ({
	ctx, permissions, tokenData
}) => {
	const fetchId = ctx.params.userId
	if (!permissions.includes(DB.Permission.GetOtherUsers) && fetchId !== tokenData?.userId) {
		const user = await getUserById(ctx.params.userId)
		ctx.status = 200
		ctx.body = filterOtherUser(user)
		return
	}
	const user = await getUserById(ctx.params.userId)

	ctx.status = 200
	ctx.body = filterUser(user)
}

export const updateUserHandler: Handler<UpdateUserSchema> = async ({
	ctx, tokenData, permissions, body
}) => {
	const fetchId = ctx.params.userId
	if (fetchId !== tokenData?.userId) {
		if (!permissions.includes(DB.Permission.EditOtherUsers)) throw new HTTPError(AuthError.InvalidPermissions)
	}
	await updateUserById(ctx.params.userId, body)
	const user = await getUserById(ctx.params.userId)

	ctx.status = 200
	ctx.body = filterUser(user)
}