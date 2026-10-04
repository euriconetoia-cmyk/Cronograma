import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(eslint.configs.recommended, ...tseslint.configs.recommended, {
  files: ['**/*.{ts,tsx}'],
  languageOptions: {
    globals: {
      ...globals.node,
      ...globals.browser,
    },
  },
  ignores: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/coverage/**'],
});
