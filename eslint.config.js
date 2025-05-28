// TypeScript core plugin + parser
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
const tsRecommended = tsPlugin.configs.recommended;

// React-specific plugins
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  {
    // Global ignore patterns
    ignores: [
      '**/dist/**/*',
      '**/build/**/*',
      '**/node_modules/**/*',
      'client/vite.config.ts',
      '**/*.config.{ts,js}'
    ]
  },

  // TypeScript linting for client + server
  {
    files: ['client/src/**/*.{ts,tsx}', 'server/src/**/*.ts'],
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
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },

  // React rules for client only
  {
    files: ['client/src/**/*.{ts,tsx,js,jsx}'],
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
