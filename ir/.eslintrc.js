module.exports = {
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "plugin:jsdoc/recommended"
    ],
    plugins: [
        "jsdoc"
    ],
    parser: '@typescript-eslint/parser',    // Specifies the ESLint parser
    parserOptions: {
        ecmaVersion: 2018,                  // Allows for the parsing of modern ECMAScript features
        sourceType: 'module',               // Allows for the use of imports,
        project: "tsconfig.json"            // Specify typescript project
    },
    env: {
        "node": true,                       // node environment, not browser
        "es6": true                         // es flavour
    },
    settings: {
        jsdoc: {
            mode: "typescript"
        }
    },
    rules: {
        "indent": "off",                                            // replaced below
        "@typescript-eslint/indent": [                              // set up indentation settings
            "error",
            4,
            {
                "MemberExpression": 1,
                "FunctionDeclaration": { "body": 1, "parameters": 2 },
                "FunctionExpression": { "parameters": "first" },
                "CallExpression": { "arguments": "first" },
                "ArrayExpression": 1,
                "ObjectExpression": 1,
                "ImportDeclaration": 1,
                "flatTernaryExpressions": false,
                "ignoreComments": false
            }
        ],
        "semi": "off",                                              // replaced below
        "@typescript-eslint/semi": ["warn"],                        // always require semicolon
        "curly": ["warn", "multi-or-nest"],                         // use curly braces if more than one line
        "comma-dangle": ["warn", "never"],                          // no comma in last object property
        "space-before-function-paren": ["error", {                  // no space after function definition and parenthesis
            "anonymous": "always",
            "named": "never",
            "asyncArrow": "always"
        }],
        "max-len": ["warn", { "code": 120, "tabWidth": 2 }],       // line max len 120 chars
        "quote-props": ["error", "as-needed"],                      // require quotes around object literal property names
        "no-console": "off",                                        // no console log
        "spaced-comment": ["warn", "always"],                       // require a whitespace immediately after the initial // or /* of a comment
        "multiline-comment-style": ["error", "starred-block"],      // require multiline comments to have starting asterisks
        "@typescript-eslint/no-explicit-any": "off",                // allow any types to be defined         

        "quotes": "off",                                            // replaced below
        "@typescript-eslint/quotes": ["warn", "double"],            // use only double quotes

        "no-unused-expressions": "off",                             // replaced below
        "@typescript-eslint/no-unused-expressions": "error",        // error on unused expressions

        "no-unused-vars": "off",                                    // replaced below
        "@typescript-eslint/no-unused-vars": "error",               // error on unused variables

        "brace-style": "off",                                       // replaced below
        "@typescript-eslint/brace-style": ["error", "1tbs"],        // use JavaScript's style parenthesis

        "sort-imports": ["warn", {                                  // sort import alphabetically
            "ignoreCase": true,
            "ignoreDeclarationSort": false,
            "ignoreMemberSort": false,
            "memberSyntaxSortOrder": ["none", "all", "single", "multiple"]
        }],

        "key-spacing": "error",                                     // require space before literal object value 
        "keyword-spacing": "error",                                 // add a space after each reserved keyword
        "arrow-spacing": "error",                                   // require space in arrow functions
        "comma-spacing": "error",                                   // require space after each comma
        "space-infix-ops": "error",                                 // require space after infix operators (eg- +,-,*,/)
        "object-curly-spacing": ["error", "always"],                // require space after curly braces in liter objects
        "function-call-argument-newline": ["warn", "consistent"],   // function params indentation in next line must be consistent 
        "no-whitespace-before-property": "error",                   // avoid a whitespace before accessing a property of an object
        "space-in-parens": ["error", "never"],                      // avoid space in parenthesis

        "@typescript-eslint/unbound-method": "error",               // avoid referencing a method without the explicit this arg

        "dot-notation": "warn",                                     // avoid accessing properties like obj["property"]
        "newline-per-chained-call": ["warn", {                      // suggest a new line in chaining methods after the second level
            "ignoreChainWithDepth": 2
        }],

        "arrow-parens": ["error", "as-needed"],                     // arrow functions can omit parentheses when they have exactly one parameter
        "@typescript-eslint/prefer-for-of": "warn",
        "no-unreachable": "error",

        "@typescript-eslint/array-type": ["error", {                // use always Array<T> instead of T[]
            "default": "generic",
            "readonly": "generic"
        }],

        "jsdoc/require-param-type": "off",                          // avoid redundant types in func params in jsdoc comments
        "jsdoc/require-returns-type": "off"                         // avoid redundant func return type in jsdoc comments
    }
};