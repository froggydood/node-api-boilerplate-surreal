import { DB } from "../types"
import dayjs from "dayjs"

export const getDBDate = (date: Date | string | number = Date.now()): string => {
	return dayjs(date).format("YYYY-MM-DD HH:mm:ss")
}


export type DefaultUserValues = Pick<
	DB.User,
	"joinedAt" | "userRole" | "permissions"|
	"verified"
>

export const defaultUserValues: () => DefaultUserValues = () => ({
	joinedAt: getDBDate(Date.now()),
	userRole: "user",
	permissions: [],
	rating: (0).toFixed(2),
	reviewsAmount: 0,
	verified: false
})