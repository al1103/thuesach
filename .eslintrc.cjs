/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,
  extends: ['plugin:vue/vue3-essential', 'eslint:recommended', '@vue/eslint-config-typescript'],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    // Vue rules
    'vue/multi-word-component-names': 'off',
    'vue/no-v-model-assignment': 'warn',
    'vue/require-v-for-key': 'error',
    'vue/no-unused-components': 'warn',
    'vue/html-indent': ['warn', 2],

    // TypeScript rules
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-types': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',

    // Code quality rules (AI agent standards)
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-function-constructor-with-string-args': 'error',
    'no-script-url': 'error',
    'prefer-const': 'warn',
    'no-var': 'error',
    eqeqeq: ['warn', 'always'],
    curly: ['warn', 'all'],
    quotes: ['warn', 'single', { avoidEscape: true }],
    semi: ['warn', 'false'],
  },
}
