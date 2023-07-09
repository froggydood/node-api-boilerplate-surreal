declare global {
	namespace NodeJS {
		interface ProcessEnv {		
			DB_HOST: string
			DB_PORT: string
			DB_USER: string
			DB_PASSWORD: string
			DB_DATABASE: string
			DB_NAMESPACE: string
			DB_URL: string
		
			HASH_SALT: string
			REDIS_HOST: string
			REDIS_PASSWORD: string
			REDIS_PORT: string
			REDIS_USER: string
			REDIS_DB_NUMBER: string
			
			AWS_REGION: string
			AWS_ACCESS_KEY_ID: string
			AWS_SECRET_ACCESS_KEY: string
			AWS_EMAIL_SOURCE: string
		
			JWT_SECRET: string,
			JWT_ACCESS_EXPIRES_IN: string
			JWT_REFRESH_EXPIRES_IN: string
		
			API_PORT: string	
			API_BASE_URL: string
			API_BASE_PATH: string
			API_LOCAL_BASE_URL: string
			WEBSITE_LINK: string
		
			RATE_LIMIT_WINDOW_MS: string,
			RATE_LIMIT_MAX: string
			
			NODE_ENV: string
		}
	}
}

export {}