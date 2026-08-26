import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    'vue/no-multiple-template-root': 'off',
    'vue/require-default-prop': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',
    'no-useless-assignment': 'warn',
    'vue/html-self-closing': ['warn', {
      html: {
        void: 'any',
        normal: 'any',
        component: 'any'
      },
      svg: 'any',
      math: 'any'
    }],
    'vue/no-restricted-syntax': [
      'error',
      {
        selector: 'VExpressionContainer TSAsExpression',
        message: 'テンプレート内での s 型キャストは VS Code のシンタックスハイライトやパースを壊す原因になります。<script> 側で computed や関数を定義してキャストしてください。'
      }
    ]
  }
})
