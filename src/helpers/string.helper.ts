export interface IUrlParts {
	scheme?: "http" | "https",
	domain?: string,
	port?: number,
}

export const getUrlParts = (url: string): IUrlParts => {
	let mg, domain, port, scheme
	if ((mg = url.match(/^(https?):\/\/([^:]+)(:(\d+))?/))) {
		scheme = mg[1] as ("http" | "https") || "https" 
		domain = mg[2] || "db.fauna.com"
		port = Number.parseInt(mg[4]) || 443
	}
	return {
		scheme,
		domain,
		port
	}

}