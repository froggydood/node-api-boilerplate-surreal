import { DB } from "../types"
import { filterUndefined } from "../helpers"

export type QueryObject = {
	query: string,
	values: any[]
}

export const generateInsertQuery = <T extends Record<any, any>>(
	table: string,
	{
		values,
		baseVarCount = 0
	}: {
		values: DB.DBSupplyArgs<T>,
		baseVarCount?: number
	}
): QueryObject => {
	let columnStr = ""
	let valuesStr = ""
	const valueArr: any[] = []
	let varCount = baseVarCount+1
	Object.entries(filterUndefined(values)).forEach(([key, value], i) => {
		if (i !== 0) {
			columnStr = columnStr + ","
			valuesStr = valuesStr + ","
		}
		columnStr = columnStr + `"${key}"`
		valuesStr = valuesStr + `$${varCount}`
		valueArr.push(value)
		varCount++
	})

	return {
		query: `INSERT INTO "${table}" (${columnStr}) VALUES (${valuesStr});`,
		values: valueArr
	}
}

export const generateEqualClause = <T extends Record<string, any>>(
	clauseName: string,
	props: DB.DBSupplyArgs<T> = {},
	separator: string,
	escape: (keyof T)[] = [],
	baseVarCount = 0
): QueryObject => {
	let str = ""
	const values: any[] = []

	let varCount = baseVarCount+1
	Object.entries(props).forEach(([key, value], i) => {
		if (i === 0) str = `${clauseName} `
		else str = str + " " + separator + " "

		str = str + `"${key}"` + " = "

		if (escape.includes(str)) str = str + value
		else {
			str = str + `$${varCount}`
			varCount++
			values.push(value)
		}
	})

	return {
		query: str,
		values
	}
}

export const generateWhereClause = <T extends Record<string, any>>(
	filters: DB.DBSupplyArgs<T> = {},
	separator: "OR" | "AND" = "AND",
	escape: (keyof T)[] = [],
	baseVarCount = 0
): QueryObject => {
	return generateEqualClause("WHERE", filterUndefined(filters), separator, escape, baseVarCount)
}

export const generateSetClause = <T extends Record<string, any>>(
	props: DB.DBSupplyArgs<T> = {},
	escape: (keyof T)[],
	baseVarCount = 0
): QueryObject => {
	return generateEqualClause("SET", filterUndefined(props), ",", escape, baseVarCount)
}

export const generateSelectQuery = <T extends Record<string, any>>(
	table: string,
	{
		filters = {},
		fields = [],
		filterSeparator = "AND"
	}: {
		filters?: DB.DBSupplyArgs<T>,
		fields?: (keyof T | any)[],
		filterSeparator?: "OR" | "AND"
	}
): QueryObject => {
	const fieldStr = fields.length > 0 ? fields.join(",") : "*"
	const whereClause = generateWhereClause<T>(filters, filterSeparator)

	return {
		query: `SELECT ${fieldStr} FROM "${table}" ${whereClause.query};`,
		values: [...whereClause.values]
	}
}

export const generateUpdateQuery = <T extends Record<string, any>>(
	table: string,
	{
		filters = {},
		updateProps,
		filterSeparator = "AND",
		escape = []
	}: {
		filters?: DB.DBSupplyArgs<T>,
		updateProps: DB.DBSupplyArgs<T>,
		filterSeparator?: "OR" | "AND",
		escape?: (keyof T)[]
	}
): QueryObject => {
	const whereClause = generateWhereClause<T>(filters, filterSeparator, escape)
	const setClause = generateSetClause<T>(updateProps, escape, whereClause.values.length - 1)

	return {
		query: `UPDATE "${table}" ${setClause.query} ${whereClause.query};`,
		values: [...setClause.values, ...whereClause.values]
	}
}

export const generateDeleteQuery = <T extends Record<string, any>>(
	table: string,
	{
		filters = {},
		filterSeparator = "AND"
	}: {
		filters?: DB.DBSupplyArgs<T>,
		filterSeparator?: "OR" | "AND"
	}
): QueryObject => {
	const whereClause = generateWhereClause<T>(filters, filterSeparator)

	return {
		query: `DELETE FROM "${table}" ${whereClause.query};`,
		values: [...whereClause.values]
	}
}

export const formatSqlValue = (value: unknown): string => {
	if (!value) return "NULL"
	if (typeof(value) === "string") return `"${value.replace(/"/g, '\\"')}"`
	return value.toString()
}

export const formatSqlArray = <T>(arr: T[]) => {
	return `{${arr.map((v) => formatSqlValue(v)).join(", ")}}`
}