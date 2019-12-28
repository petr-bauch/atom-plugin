module.exports = {
  ignorePatterns: ['node_modules/', 'spec/'],
  env: {
    node: true,
    browser: true,
    es6: true,
  },
  extends: [
    'airbnb-base',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  rules: {
    'import/no-unresolved': 'warn',
    'consistent-return': 'warn',
    'no-shadow': 'warn',
    'prefer-promise-reject-errors': 'warn',
    'no-unused-vars': 'warn',
    'no-continue': 'warn',
    'no-trailing-spaces': 'warn',

    'import/prefer-default-export': 'off',
    'import/no-unresolved': 'off',
    'no-console': 'off',
    'no-undef': 'off',
    'class-methods-use-this': 'off',
    'max-len': 'off',
    'padded-blocks': 'off',
    'lines-between-class-members': 'off',
    'prefer-object-spread': 'off',
    'arrow-parens': 'off',
    'no-restricted-syntax': 'off',
  },
};
