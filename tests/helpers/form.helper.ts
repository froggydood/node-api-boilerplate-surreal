import FormData from "form-data"

export const convertObjToFormData = (obj: Record<string, any>): FormData => {
	const formData = new FormData()
	Object.entries(obj).forEach(([key, value]) => {
		formData.append(key, value)
	})

	return formData
}