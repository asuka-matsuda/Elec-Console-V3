import simpleImportSort from 'eslint-plugin-simple-import-sort'

import withNuxt from './.nuxt/eslint.config.mjs'
import noCardOrBoxNaming from './eslint-rules/no-card-or-box-naming.mjs'
import noCommentedCode from './eslint-rules/no-commented-code.mjs'
import noEventPassThrough from './eslint-rules/no-event-pass-through.mjs'
import noHoverTransitionOverride from './eslint-rules/no-hover-transition-override.mjs'
import noJsdocTypeAnnotations from './eslint-rules/no-jsdoc-type-annotations.mjs'
import noLegacyCssVars from './eslint-rules/no-legacy-css-vars.mjs'
import noPureAccessibility from './eslint-rules/no-pure-accessibility.mjs'
import noRawHtmlElements from './eslint-rules/no-raw-html-elements.mjs'
import noRedundantTailwindClasses from './eslint-rules/no-redundant-tailwind-classes.mjs'
import noRedundantVueDefaults from './eslint-rules/no-redundant-vue-defaults.mjs'
import noSlotForwarding from './eslint-rules/no-slot-forwarding.mjs'
import noTailwindDecoration from './eslint-rules/no-tailwind-decoration.mjs'
import noTemplateComments from './eslint-rules/no-template-comments.mjs'
import noTrivialFacade from './eslint-rules/no-trivial-facade.mjs'
import noUnsupportedSizeProp from './eslint-rules/no-unsupported-size-prop.mjs'
import requireFileJsdoc from './eslint-rules/require-file-jsdoc.mjs'
import strictBadgeUsage from './eslint-rules/strict-badge-usage.mjs'
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
          'no-tailwind-decoration': noTailwindDecoration,
          'no-redundant-tailwind-classes': noRedundantTailwindClasses,
          'no-redundant-vue-defaults': noRedundantVueDefaults,
          'strict-spacing-tokens': strictSpacingTokens,
          'no-hover-transition-override': noHoverTransitionOverride,
          'no-legacy-css-vars': noLegacyCssVars,
          'no-pure-accessibility': noPureAccessibility,
          'no-template-comments': noTemplateComments,
          'require-file-jsdoc': requireFileJsdoc,
          'no-commented-code': noCommentedCode,
          'no-card-or-box-naming': noCardOrBoxNaming,
          'no-raw-html-elements': noRawHtmlElements,
          'no-jsdoc-type-annotations': noJsdocTypeAnnotations,
          'no-trivial-facade': noTrivialFacade,
          'no-unsupported-size-prop': noUnsupportedSizeProp,
          'strict-state-management': strictStateManagement,
          'strict-state-mixins': strictStateMixins,
          'strict-time-management': strictTimeManagement,
          'strict-ui-states': strictUiStates,
          'strict-badge-usage': strictBadgeUsage,
          'strict-icon-usage': strictIconUsage,
          'strict-responsive-tokens': strictResponsiveTokens,
          'no-event-pass-through': noEventPassThrough,
          'no-slot-forwarding': noSlotForwarding,
        },
      },
    },
    rules: {
      'local/no-event-pass-through': 'error',
      'local/no-slot-forwarding': 'error',
      'local/strict-responsive-tokens': ['error', { allowMobileFirst: true }],
      'local/strict-icon-usage': 'error',
      'local/no-tailwind-decoration': 'error',
      'local/no-redundant-tailwind-classes': 'error',
      'local/no-redundant-vue-defaults': 'error',
      'local/strict-spacing-tokens': 'error',
      'local/no-hover-transition-override': 'error',
      'local/no-legacy-css-vars': 'error',
      'local/no-pure-accessibility': 'error',
      'local/no-commented-code': 'error',
      'local/no-jsdoc-type-annotations': 'error',
      'local/no-trivial-facade': 'error',
      'local/strict-state-management': 'error',
      'local/strict-state-mixins': 'error',
      'local/strict-time-management': 'error',
      'local/strict-ui-states': 'error',
      'local/strict-badge-usage': 'error',
      // AI開発効率化のため無効化したルール
      'local/no-raw-html-elements': 'off',
      'local/no-card-or-box-naming': 'off',
      'local/require-file-jsdoc': 'off',
      'local/no-template-comments': 'off',
      'local/no-unsupported-size-prop': 'off',
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
