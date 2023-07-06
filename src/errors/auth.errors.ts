import { ErrorMap } from "./errors.types"

export enum AuthError {
	InvalidAuthToken = 1000,
	ExpiredAuthToken,
	InvalidPermissions,
	NoToken,
	UsernameAlreadyExists,
	EmailAlreadyExists,
	IncorrectUsernamePasswordCombo,
	ErrorCreatingToken,
	PasswordsDontMatch,
	VerificationTokensDontMatch,
	UserAlreadyVerified,
	PasswordsAreTheSame,
	NoUserForToken,
	ExpiredVerificationToken,
	ExpiredPasswordRestToken,
	TooManyRequests
}

export const authErrorMap: ErrorMap<AuthError> = {
	[AuthError.InvalidAuthToken]: [401, "Authentication token is invalid"],
	[AuthError.ExpiredAuthToken]: [400, "Authentication token has expired"],
	[AuthError.InvalidPermissions]: [403, "You don't have the permissions for that"],
	[AuthError.NoToken]: [401, "No token provided"],
	[AuthError.UsernameAlreadyExists]: [400, "Username already exists"],
	[AuthError.EmailAlreadyExists]: [400, "Email already exists"],
	[AuthError.IncorrectUsernamePasswordCombo]: [400, "Username and password combination is invalid"],
	[AuthError.ErrorCreatingToken]: [500, "Error creating token"],
	[AuthError.PasswordsDontMatch]: [400, "Password doesn't match"],
	[AuthError.VerificationTokensDontMatch]: [400, "No user exists with that verification token"],
	[AuthError.UserAlreadyVerified]: [400, "User is already verified"],
	[AuthError.PasswordsAreTheSame]: [400, "Password is the same"],
	[AuthError.NoUserForToken]: [400, "No user with that token was found"],
	[AuthError.ExpiredVerificationToken]: [400, "Verification token has expired"],
	[AuthError.ExpiredPasswordRestToken]: [400, "Password reset token has expired"],
	[AuthError.TooManyRequests]: [429, "Too many requests"]
}