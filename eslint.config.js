import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import vitest from '@vitest/eslint-plugin';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: ['dist', 'coverage'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      reactRefresh.configs.vite,
      prettierConfig,
    ],
    plugins: {
      'react-hooks': reactHooks,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Only the two classic, uncontroversial hooks-correctness rules; the plugin's
      // "recommended-latest" preset also bundles opinionated React Compiler-era rules
      // (set-state-in-effect, purity, immutability, …) this project doesn't opt into.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // GameContext.tsx intentionally colocates the `GameProvider` component with its
      // `useGame` hook; that's the standard React context pattern, not a fast-refresh hazard.
      'react-refresh/only-export-components': ['warn', { allowExportNames: ['useGame'] }],
      // tsc already enforces unused locals/params with noUnusedLocals/noUnusedParameters;
      // avoid a second, differently-configured source of truth for the same check.
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    files: ['src/**/*.test.ts'],
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
    },
  },
  {
    files: ['*.config.{js,ts}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
    },
  },
);
