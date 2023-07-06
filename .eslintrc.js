module.exports = {
	"env": {
		"browser": false,
		"es2021": true,
		"node": true
	},
	"ignorePatterns": ["*.js"],
	"extends": [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended"
	],
	"overrides": [
	],
	"parser": "@typescript-eslint/parser",
	"parserOptions": {
		"ecmaVersion": "latest",
		"sourceType": "module"
	},
	"plugins": [
		"@typescript-eslint"
	],
	"rules": {
		"no-empty": ["warn", {"allowEmptyCatch": true}],
		"@typescript-eslint/no-explicit-any": "off",
		"no-async-promise-executor": "off",
		"@typescript-eslint/no-unused-vars": ["warn", {"args": "none"}],
		"@typescript-eslint/no-namespace": "off",
		"indent": "off",
		"@typescript-eslint/indent": ["error", "tab", {"ignoredNodes": ["TSTypeParameterInstantiation > *", "ArrowFunctionExpression > TSTypeAnnotation"]}],
		"quotes": ["error", "double", {"avoidEscape": true, "allowTemplateLiterals": true}],
		"semi": [
			"error",
			"never"
		],
		"@typescript-eslint/no-empty-function": "off",
		"@typescript-eslint/ban-types": "off",
		"@typescript-eslint/no-non-null-assertion": "off",
		"@typescript-eslint/no-extra-non-null-assertion": "off",
		"@typescript-eslint/ban-ts-comment": "off"
	}
}
