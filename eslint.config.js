// Note; TypeScript core plugin + parser
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
const tsRecommended = tsPlugin.configs.recommended;

// Note; React-specific plugins
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  // Note; Global ignores to avoid linting build artifacts
  {
    ignores: [
      'dist/**/*',
      'build/**/*',
      'client/dist/**/*',
      'server/dist/**/*',
      'client/vite.config.ts',
      '**/*.js' // Optional; skip built .js files entirely
    ]
  },

  // Note; TypeScript linting for both client and server
  {
    files: ['server/**/*.{ts,js}', 'client/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ['./client/tsconfig.json', './server/tsconfig.json'],
        sourceType: 'module',
        ecmaVersion: 2020
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin
    },
    rules: {
      ...tsRecommended.rules,
      '@typescript-eslint/no-explicit-any': 'off',

      // Optional override if needed:
      // '@typescript-eslint/no-empty-object-type': 'off'
    }
  },

  // Note; React rules for the client only
  {
    files: ['client/**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './client/tsconfig.json',
        sourceType: 'module',
        ecmaVersion: 2020,
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'react-refresh': reactRefreshPlugin
    },
    settings: {
      react: { version: '18.2' }
    },
    rules: {
      'react-refresh/only-export-components': 'warn',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn'
    }
  }
];
