module.exports = {
  root: true,
  ignorePatterns: [
    '**/dist/**',
    '**/node_modules/**',
    '**/*.timestamp-*.mjs',
    '**/coverage/**',
    'attadia.com/**',
  ],
  overrides: [
    {
      files: ['apps/backend/**/*.js'],
      env: { es2022: true, node: true, browser: false },
      extends: ['eslint:recommended'],
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
      rules: {
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        'no-case-declarations': 'off',
        'no-empty': ['error', { allowEmptyCatch: true }],
      },
    },
    {
      files: ['apps/backend/**/__tests__/**/*.js', 'apps/backend/**/*.test.js'],
      env: { jest: true },
    },
    {
      files: ['apps/**/*.{js,jsx}'],
      excludedFiles: ['apps/backend/**'],
      env: { browser: true, es2022: true, node: true },
      extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:react/jsx-runtime',
        'plugin:react-hooks/recommended',
      ],
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      settings: { react: { version: 'detect' } },
      plugins: ['react', 'react-hooks', 'react-refresh'],
      rules: {
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        'no-empty': ['error', { allowEmptyCatch: true }],
        'react/prop-types': 'off',
        'react/react-in-jsx-scope': 'off',
        'react-hooks/rules-of-hooks': 'warn',
        'react-hooks/exhaustive-deps': 'warn',
        'no-case-declarations': 'off',
        'react/display-name': 'off',
        'react/no-unescaped-entities': 'off',
        'react/no-children-prop': 'off',
        'no-useless-catch': 'warn',
        'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      },
    },
  ],
};
