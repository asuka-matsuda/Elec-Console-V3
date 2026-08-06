// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/scss/style.scss'],

  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],

  app: {
    head: {
      script: [
        { src: 'https://unpkg.com/feather-icons' },
        { innerHTML: 'window.onload = function() { feather.replace(); }', type: 'text/javascript' }
      ]
    }
  },

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "~/assets/scss/foundation/_variables.scss" as *; @use "~/assets/scss/foundation/_mixins.scss" as *; @use "~/assets/scss/foundation/_functions.scss" as *;'
        }
      }
    }
  },

  modules: ['@nuxtjs/storybook']
})