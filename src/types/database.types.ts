import { Generated } from "kysely";

export namespace DB {
	export type Decimal = string;
	export type Date = number;
	export type TimeStamp = string
	export type DBBool = boolean

	export type DBSupplyArg<T> = T extends (Record<any, any> | any[]) ? string : T

	export type DBSupplyArgs<T extends Record<any, any>> = Partial<{
		[key in keyof T]: DBSupplyArg<T[key]>
	}>

	export type InsertArgs<T extends Record<any, any>> = Pick<T, {
		[key in keyof T]: null extends T[key]
			? never
			: T[key] extends Generated<any>
				? never
				: key
	}[keyof T]> & Partial<RemoveKyselyTypes<T>>

	export enum Permission {
		GetOtherUsers,
		DeleteOtherUsersThemes,
		EditOtherUsers,
		EditOtherUsersThemes
	}
	
	export type UserRole = "user" | "admin"

	type RemoveKyselyTypes<T> =
		T extends Generated<infer K>
			? K :
			T extends {}
				? {[key in keyof T]: RemoveKyselyTypes<T[key]>}
				: T

	export interface DB {
		"user": DB_User
	}

	export interface DB_User {
		id: Generated<string>,
		username: string,
		firstName: string,
		lastName: string,
		email: string,
		passwordHash: string,
		joinedAt: Generated <TimeStamp>,
		userRole: Generated<UserRole>,
		verified: Generated<DBBool>,
		permissions: Generated<Permission[]>
	}
	export type User = RemoveKyselyTypes<DB_User>

	export interface DB_HasToken {
		id: Generated<string>,
		in: string,
		out: string
	}
	export type HasToken = RemoveKyselyTypes<DB_HasToken>

	export interface DB_UserToken {
		id: Generated<string>,
		createdAt: Generated<TimeStamp>,
		type: TokenType,
		expiresAt?: TimeStamp,
	}
	export type UserToken = RemoveKyselyTypes<DB_UserToken>
	export type TokenType = "verification" | "password_reset"
}