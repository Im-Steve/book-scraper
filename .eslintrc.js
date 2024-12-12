module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
  },
  extends: 'airbnb-base',
  overrides: [
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'no-await-in-loop': 'off',
    'no-nested-ternary': 'off',
    'no-restricted-syntax': 'off',
    'prefer-object-spread': 'off',
  },
};
