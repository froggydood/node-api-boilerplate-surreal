import env from "../env"
import { SESClient, SendTemplatedEmailCommand  } from "@aws-sdk/client-ses"

const client = new SESClient({
	region: env.AWS_REGION,
	credentials: {
		accessKeyId: env.AWS_ACCESS_KEY_ID,
		secretAccessKey: env.AWS_SECRET_ACCESS_KEY
	}
})

export interface EmailArgs {
	template: string,
	to: string,
	variables?: Record<string, any>
}

export const sendEmail = async (args: EmailArgs): Promise<void> => {
	const command = new SendTemplatedEmailCommand({
		Template: args.template,
		Destination: {
			ToAddresses: [args.to]
		},
		TemplateData: JSON.stringify({
			...args.variables,
			website_link: env.WEBSITE_LINK
		}),
		Source: env.AWS_EMAIL_SOURCE
	})

	await client.send(command)
}

export const sendVerificationEmail = async (to: string, verificationToken: string): Promise<void> => {
	await sendEmail({
		to,
		template: "VerifyEmail",
		variables: {
			verification_token: verificationToken
		}
	})
}

export const sendForgotPasswordEmail = async (to: string, forgotPasswordToken: string): Promise<void> => {
	await sendEmail({
		to,
		template: "ForgotPassword",
		variables: {
			password_reset_token: forgotPasswordToken
		}
	})
}