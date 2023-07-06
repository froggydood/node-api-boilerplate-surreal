import { ErrorMap } from "./errors.types"

export enum ValidationError {
	InvalidData = 2000,
	NoImageProvided,
	InvalidImage,
	ImageTooLarge,
	TooManyImages
}

export const validationErrorMap: ErrorMap<ValidationError> = {
	[ValidationError.InvalidData]: [400, "Data provided is invalid"],
	[ValidationError.NoImageProvided]: [400, "The image was not provided"],
	[ValidationError.InvalidImage]: [400, "The image provided was invalid"],
	[ValidationError.ImageTooLarge]: [400, "The image provided is too large"],
	[ValidationError.TooManyImages]: [400, "Too many images were provided"]
}