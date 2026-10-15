import simpleImportSort from 'eslint-plugin-simple-import-sort'

import withNuxt from './.nuxt/eslint.config.mjs'
import noCommentedCode from './eslint-rules/no-commented-code.mjs'
import noEventPassThrough from './eslint-rules/no-event-pass-through.mjs'
import noHoverTransitionOverride from './eslint-rules/no-hover-transition-override.mjs'
import noJsdocTypeAnnotations from './eslint-rules/no-jsdoc-type-annotations.mjs'
import noLegacyCssVars from './eslint-rules/no-legacy-css-vars.mjs'
import noPageScopedCss from './eslint-rules/no-page-scoped-css.mjs'
import noPureAccessibility from './eslint-rules/no-pure-accessibility.mjs'
import noRedundantTailwindClasses from './eslint-rules/no-redundant-tailwind-classes.mjs'
import noRedundantVueDefaults from './eslint-rules/no-redundant-vue-defaults.mjs'
import noSlotForwarding from './eslint-rules/no-slot-forwarding.mjs'
import noTailwindDecoration from './eslint-rules/no-tailwind-decoration.mjs'
import noTrivialFacade from './eslint-rules/no-trivial-facade.mjs'
import strictComponentUsage from './eslint-rules/strict-component-usage.mjs'
import strictIconUsage from './eslint-rules/strict-icon-usage.mjs'
import strictResponsiveTokens from './eslint-rules/strict-responsive-tokens.mjs'
import strictSpacingTokens from './eslint-rules/strict-spacing-tokens.mjs'
import strictStateManagement from './eslint-rules/strict-state-management.mjs'
import strictStateMixins from './eslint-rules/strict-state-mixins.mjs'
import strictTimeManagement from './eslint-rules/strict-time-management.mjs'
import strictUiStates from './eslint-rules/strict-ui-states.mjs'

export default withNuxt(
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
      'local': {
        rules: {
          'no-commented-code': noCommentedCode,
          'no-event-pass-through': noEventPassThrough,
          'no-hover-transition-override': noHoverTransitionOverride,
          'no-jsdoc-type-annotations': noJsdocTypeAnnotations,
          'no-legacy-css-vars': noLegacyCssVars,
          'no-page-scoped-css': noPageScopedCss,
          'no-pure-accessibility': noPureAccessibility,
          'no-redundant-tailwind-classes': noRedundantTailwindClasses,
          'no-redundant-vue-defaults': noRedundantVueDefaults,
          'no-slot-forwarding': noSlotForwarding,
          'no-tailwind-decoration': noTailwindDecoration,
          'no-trivial-facade': noTrivialFacade,
          'strict-component-usage': strictComponentUsage,
          'strict-icon-usage': strictIconUsage,
          'strict-responsive-tokens': strictResponsiveTokens,
          'strict-spacing-tokens': strictSpacingTokens,
          'strict-state-management': strictStateManagement,
          'strict-state-mixins': strictStateMixins,
          'strict-time-management': strictTimeManagement,
          'strict-ui-states': strictUiStates,
        },
      },
    },
    rules: {
      'local/no-commented-code': 'error',
      'local/no-event-pass-through': 'error',
      'local/no-hover-transition-override': 'error',
      'local/no-jsdoc-type-annotations': 'error',
      'local/no-legacy-css-vars': 'error',
      'local/no-page-scoped-css': 'error',
      'local/no-pure-accessibility': 'error',
      'local/no-redundant-tailwind-classes': 'error',
      'local/no-redundant-vue-defaults': 'error',
      'local/no-slot-forwarding': 'error',
      'local/no-tailwind-decoration': 'error',
      'local/no-trivial-facade': 'error',
      'local/strict-component-usage': 'error',
      'local/strict-icon-usage': 'error',
      'local/strict-responsive-tokens': ['error', { allowMobileFirst: true }],
      'local/strict-spacing-tokens': 'error',
      'local/strict-state-management': 'error',
      'local/strict-state-mixins': 'error',
      'local/strict-time-management': 'error',
      'local/strict-ui-states': 'error',
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
      'vue/no-v-html': 'off',
      'vue/no-multiple-template-root': 'off',
      'vue/require-default-prop': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/first-attribute-linebreak': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
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
