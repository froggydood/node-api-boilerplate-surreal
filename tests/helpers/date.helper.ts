import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
dayjs.extend(utc)

export const getDBDate = (date: Date | string | number = Date.now()): string => {
	return dayjs(date).format("YYYY-MM-DD HH:mm:ss")
}

export const isDateExpired = (_date: Date | string | number, expiresAfterMins: number): boolean => {
	const date = dayjs(_date).utc()

	const minutesSince = ((Date.now() - date.toDate().getTime()) / (1000 * 60))
	
	return minutesSince > expiresAfterMins
}