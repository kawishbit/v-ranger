import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import vue from 'eslint-plugin-vue'
import globals from 'globals'
import ts from 'typescript-eslint'

export default ts.config(
  {
    // `type-tests/` is fixtures for `vue-tsc`, not source; `bad.vue` fails on
    // purpose. `examples/` is its own standalone npm project, with a build and
    // lint surface of its own.
    ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'type-tests/**', 'examples/**'],
  },
  js.configs.recommended,
  ts.configs.recommended,
  vue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: ts.parser } },
  },
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    // The package exposes exactly one component and it is called `Ranger`.
    files: ['src/**'],
    rules: { 'vue/multi-word-component-names': 'off' },
  },
  // Must stay last: turns off every rule Prettier owns.
  prettier,
)
