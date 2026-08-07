import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    'vue/require-default-prop': 'off',
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
