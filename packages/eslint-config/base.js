import js from "@eslint/js"
import eslintConfigPrettier from "eslint-config-prettier"
import onlyWarn from "eslint-plugin-only-warn"
import turboPlugin from "eslint-plugin-turbo"
import stylistic from "@stylistic/eslint-plugin-js"
import preferArrow from "eslint-plugin-prefer-arrow"
import importRules from "eslint-plugin-import"
import tseslint from "typescript-eslint"

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
      "prefer-arrow": preferArrow,
      "import": importRules,
      "@stylistic/js": stylistic
    },
    rules: {
      "@stylistic/js/semi": ["error", "never"],
      "@stylistic/js/quotes": ["error", "single"],
      "no-console": "error",
      "react/jsx-no-undef": ["error", { "allowGlobals": true }],
      "react-hooks/exhaustive-deps": "off", // Disable exhaustive-deps rule
      "react/no-unescaped-entities": "off",
      "react/display-name": "off",
      "prefer-arrow/prefer-arrow-functions": ["error", {
        "disallowPrototype": true,
        "singleReturnOnly": false,
        "classPropertiesAllowed": false
      }],
      "prefer-arrow-callback": ["error", { "allowNamedFunctions": true }],
      "func-style": ["error", "expression", { "allowArrowFunctions": true }],


      // Stylistic rules
      "@stylistic/js/indent": ["error", "tab"], // Enforces consistent indentation using tabs
      "@stylistic/js/eol-last": ["error", "always"], // Enforces that files end with a newline
      "@stylistic/js/padding-line-between-statements": ["error", {
        "blankLine": "always",
        "prev": "directive",
        "next": "*"
      }], // Enforces padding lines between directives
      "import/newline-after-import": ["error", { "count": 1 }], // Enforces a newline after import statements
      "@stylistic/js/function-call-spacing": ["error", "never"], // Enforces consistent spacing in function calls
      "@stylistic/js/comma-dangle": ["error", "never"], // Enforces no trailing commas
      "@stylistic/js/brace-style": ["error", "1tbs", { "allowSingleLine": true }], // Enforces one true brace style
      "@stylistic/js/arrow-spacing": ["error", {
        "before": true, "after": true
      }], // Enforces consistent spacing around arrow functions
      "@stylistic/js/block-spacing": ["error", "never"], // Enforces consistent spacing inside of blocks
      "@stylistic/js/comma-spacing": ["error", {
        "before": false,
        "after": true
      }], // Enforces consistent spacing around commas
      "@stylistic/js/comma-style": ["error", "last"], // Enforces comma to be at the end of the line
      "@stylistic/js/computed-property-spacing": "error", // Enforces consistent spacing in computed properties
      "@stylistic/js/function-call-argument-newline": ["error", "consistent"], // Enforces consistent spacing in function calls
      "@stylistic/js/function-paren-newline": ["error", "consistent"], // Enforces consistent spacing in function calls
      "@stylistic/js/implicit-arrow-linebreak": ["error", "beside"], // Enforces consistent spacing in function calls
      "@stylistic/js/jsx-quotes": ["error", "prefer-double"], // Enforces double quotes in JSX
      "@stylistic/js/key-spacing": ["error", {
        "beforeColon": false,
        "afterColon": true,
        "mode": "strict"
      }], // Enforces consistent spacing around object keys
      "@stylistic/js/keyword-spacing": ["error", {
        "before": true,
        "after": true
      }], // Enforces consistent spacing around keywords
      "@stylistic/js/lines-between-class-members": ["error", "always"], // Enforces lines between class members
      "@stylistic/js/multiline-comment-style": ["error", "starred-block"], // Enforces a consistent style for multiline comments
      "@stylistic/js/no-floating-decimal": "error", // Enforces no floating decimals
      "@stylistic/js/no-multi-spaces": "warn", // Enforces no multiple spaces
      "@stylistic/js/no-multiple-empty-lines": "warn", // Enforces no more than 2 multiple empty lines
      "@stylistic/js/no-trailing-spaces": "warn", // Enforces no trailing spaces
      "@stylistic/js/no-whitespace-before-property": "error", // Enforces no whitespace before properties
      "@stylistic/js/object-curly-spacing": "error", // Enforces no spacing directly inside object curly braces
      "@stylistic/js/rest-spread-spacing": "error", // Enforces no spacing directly inside rest/spread operators
      "@stylistic/js/space-infix-ops": "error", // Enforces spacing around infix operators
      "@stylistic/js/spaced-comment": ["error", "always"], // Enforces spacing around comments
      "@stylistic/js/switch-colon-spacing": "error", // Enforces no space before and spacing after switch case colons
      "@stylistic/js/template-curly-spacing": "error", // Enforces no spacing directly inside template curly braces
      "@stylistic/js/template-tag-spacing": "error" // Enforces no spacing directly inside template tags
    },
  },
  {
    plugins: {
      onlyWarn,
    },
  },
  {
    ignores: ["dist/**"],
  },
]
