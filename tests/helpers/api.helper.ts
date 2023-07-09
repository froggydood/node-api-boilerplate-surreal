import axios, { AxiosRequestConfig, AxiosResponse } from "axios"
import {
	ChangePasswordSchema,
	ForgotPasswordSchema,
	LoginRequestSchema,
	RefreshTokenSchema,
	RegisterRequestSchema,
	ResetPasswordSchema,
	UpdateUserSchema
} from "../../src/schema"

import env from "../config/env"
import { API } from "../../src/types"

export type Method = "get" | "post" | "delete" | "put" | "patch"

let globalIPCount = Math.random()

export namespace APIHelpers {
	export const apiFetch = async <T>(
		method: Method,
		url: string,
		config?: AxiosRequestConfig & {authToken?: string}
	): Promise<AxiosResponse<T>> => {
		globalIPCount++
		const newConfig: AxiosRequestConfig = {
			...(config || {}),
			headers: {
				...config?.headers,
				...(config?.authToken ? {
					"Authorization": "Bearer " + config?.authToken
				} : {}),
				"X-IP": config?.headers?.["X-IP"] || globalIPCount.toString()
			}
		}

		if (["get", "delete"].includes(method)) {
			const res = await axios[method]<T>(env.API_BASE_URL + url, newConfig)
			return res
		} else {
			const res = await axios[method]<T>(env.API_BASE_URL + url, newConfig.data, newConfig)
			return res
		}
	}

	export const login = (args: LoginRequestSchema, options?: AxiosRequestConfig) => {
		return apiFetch<API.LoginResponse>("post", "/auth/login", {
			...options,
			data: args,
		})
	}

	export const register = (args: RegisterRequestSchema) => {
		return apiFetch<API.LoginResponse>("post", "/auth/register", {
			data: args
		})
	}

	export const refreshToken = (args: RefreshTokenSchema) => {
		return apiFetch<API.Tokens>("post", "/auth/refresh-token", {
			data: args
		})
	}

	export const changePassword = (args: ChangePasswordSchema, authToken?: string) => {
		return apiFetch<API.LoginResponse>("post", "/auth/change-password", {
			data: args,
			authToken
		})
	}

	export const sendVerificationEmail = () => {
		return apiFetch<null>("post", "/auth/change-password")
	}

	export const verifyEmail = (token: string) => {
		return apiFetch<null>("get", "/auth/verify", {
			params: {token}
		})
	}

	export const forgotPassword = (args: ForgotPasswordSchema) => {
		return apiFetch<null>("post", "/auth/forgot-password", {
			data: args
		})
	}

	export const resetPassword = (args: ResetPasswordSchema) => {
		return apiFetch<null>("post", "/auth/reset-password", {
			data: args
		})
	}

	export const getUser = (userId: string, authToken?: string) => {
		return apiFetch<API.User>("get", "/user/" + userId, {authToken})
	}

	export const updateUser = (userId: string, data: UpdateUserSchema, authToken?: string) => {
		return apiFetch<API.User>("patch", "/user/" + userId, {authToken, data})
	}

}