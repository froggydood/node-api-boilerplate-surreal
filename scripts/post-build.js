const fs = require("fs")
const path = require("path")

const files = []

const addFiles = (root) => {
	const dir = fs.readdirSync(root)
	dir.forEach((item) => {
		const stats = fs.lstatSync(path.join(root, item))
		if (stats.isDirectory()) addFiles(path.join(root, item))
		if (stats.isFile()) files.push(path.join(root, item))
	})
}

addFiles(path.join(__dirname, "..", "dist"))

files.filter((file) => file.endsWith(".js")).forEach((file) => {
	const sharedDir = path.relative(file, path.join(__dirname, "..", "shared"))
		.replace(/\\/g, "/")
		.replace("../../", "")
	const data = fs.readFileSync(file, "utf-8")
	const appRegex = /require\(("|')@app\/shared/g
	const newData = data.split("\n")
		.map((line) => {
			const match = appRegex.exec(line)
			if (!match) return line;
			const start = "require(".length
			const quote = match[0].substring(start, start+1)
			const newLine =  line.replace(appRegex, `require(${quote}${sharedDir}`)
			return newLine
		}).join("\n")
	fs.writeFileSync(file, newData)
})

const filesToCopy = [
	[
		path.join(__dirname, "..", "..", ".env.base"), path.join("backend", "src", ".env.base"),
		path.join(__dirname, "..", "..", ".env.dev"), path.join("backend", "src", ".env.dev"),
		path.join(__dirname, "..", "..", ".env.prod"), path.join("backend", "src", ".env.prod"),
		path.join(__dirname, "..", "..", ".env.local"), path.join("backend", "src", ".env.local"),
	]
]

filesToCopy.forEach(([inPath, outPath]) => {
	try {
		const data = fs.readFileSync(inPath, "utf-8")
		fs.writeFileSync(path.join(__dirname, "..", "dist", outPath), data, "utf-8")
	} catch(e) {

	}
})