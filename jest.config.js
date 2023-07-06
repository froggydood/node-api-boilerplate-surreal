/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
    transform: {
		"^.+\\.ts?$": ["ts-jest", {
			tsconfig: './tsconfig.test.json'
		}]
    },
	testTimeout: 16000,
	// detectOpenHandles: true,
	silent: false,
	roots: ["./tests", "./src"]
}