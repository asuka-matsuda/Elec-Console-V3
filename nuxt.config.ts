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
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&family=Roboto+Mono:wght@400;500;700&display=swap' }
      ],
      script: [
        { src: '/theme-init.js' }
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
    },
    build: {
      target: 'esnext'
    }
  },

  modules: ['@nuxt/eslint', '@vueuse/nuxt']
})