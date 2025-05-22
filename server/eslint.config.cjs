const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const tsRecommended = require('@typescript-eslint/eslint-plugin').configs.recommended;

module.exports = [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      // Note; Use TypeScript parser for ESLint
      parser: tsParser,
      parserOptions: {
        // Note; Specify the tsconfig for project-wide rules
        project: './tsconfig.json',
        sourceType: 'module',
      },
      ecmaVersion: 2020, // Note; Support modern ECMAScript features
    },
    plugins: {
      '@typescript-eslint': tsPlugin, // Note; Enable TypeScript ESLint rules
    },
    rules: {
      // Note; Include all recommended rules from the plugin
      ...tsPlugin.configs.recommended.rules,
      ...tsRecommended.rules,
      // Note; Allow use of `any` where necessary
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
