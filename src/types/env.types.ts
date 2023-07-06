export interface EnvVariables {
	DB_HOST: string
	DB_PORT: number
	DB_USER: string
	DB_PASSWORD: string
	DB_DATABASE: string
	DB_NAMESPACE: string

	HASH_SALT: string
	REDIS_HOST: string
	REDIS_PASSWORD: string
	REDIS_PORT: number
	REDIS_USER: string
	REDIS_DB_NUMBER: number
	
	AWS_REGION: string
	AWS_ACCESS_KEY_ID: string
	AWS_SECRET_ACCESS_KEY: string
	AWS_EMAIL_SOURCE: string

	JWT_SECRET: string,
	JWT_ACCESS_EXPIRES_IN: number
	JWT_REFRESH_EXPIRES_IN: number

	API_PORT: number	
	API_BASE_URL: string
	API_BASE_PATH: string | undefined
	API_LOCAL_BASE_URL: string
	WEBSITE_LINK: string

	FRONTEND_PORT: number
	SESSION_SECRET: string
	APP_API_BASE_URL: string
	APP_HOST_URL: string

	RATE_LIMIT_WINDOW_MS: number,
	RATE_LIMIT_MAX: number
	
	NODE_ENV: string
}

export type FrontendEnvVariables = Omit<EnvVariables, {
	[key in keyof EnvVariables]: key extends `APP_${string}` ? never : key
}[keyof EnvVariables]>