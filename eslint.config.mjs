import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
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
    }]
  }
})
