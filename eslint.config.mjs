import simpleImportSort from 'eslint-plugin-simple-import-sort'

import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'vue/block-order': ['error', {
        order: ['script', 'template', 'style'],
      }],
      'vue/define-macros-order': ['error', {
        order: ['defineOptions', 'defineModel', 'defineProps', 'defineEmits', 'defineSlots'],
      }],
      'vue/padding-line-between-blocks': ['error', 'always'],
      'vue/no-restricted-syntax': [
        'error',
        {
          selector: 'VExpressionContainer TSAsExpression',
          message: 'テンプレート内での as 型キャストは VS Code のシンタックスハイライトやパースを壊す原因になります。<script> 側で computed や関数を定義してキャストしてください。',
        },
      ],
      '@stylistic/padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
        { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
        { blankLine: 'always', prev: 'directive', next: '*' },
        { blankLine: 'any', prev: 'directive', next: 'directive' },
        { blankLine: 'always', prev: 'import', next: '*' },
        { blankLine: 'any', prev: 'import', next: 'import' },
      ],
      '@stylistic/spaced-comment': ['error', 'always', {
        markers: ['/'],
        exceptions: ['-', '+', '*'],
      }],
      // Custom overrides
      'vue/no-v-html': 'off',
      'vue/no-multiple-template-root': 'off',
      'vue/require-default-prop': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/first-attribute-linebreak': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-useless-assignment': 'warn',
      'vue/html-self-closing': ['warn', {
        html: { void: 'any', normal: 'any', component: 'any' },
        svg: 'any',
        math: 'any',
      }],
    },
  },
)
