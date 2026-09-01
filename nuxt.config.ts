// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: ['@nuxt/eslint', '@vueuse/nuxt'],

  components: [
    {
      path: '~/components/Portal',
      pathPrefix: false,
    },
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],
  devtools: { enabled: true },

  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&family=Roboto+Mono:wght@400;500;700&display=swap' },
      ],
      script: [
        { src: '/theme-init.js' },
      ],
    },
  },
  css: ['~/assets/scss/style.scss'],
  compatibilityDate: '2025-07-15',

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @use "~/assets/scss/foundation/_variables.scss" as *;
            @use "~/assets/scss/foundation/mixins/_layout.scss" as *;
            @use "~/assets/scss/foundation/mixins/_typography.scss" as *;
            @use "~/assets/scss/foundation/mixins/_states.scss" as *;
            @use "~/assets/scss/foundation/mixins/_effects.scss" as *;
            @use "~/assets/scss/foundation/_forms.scss" as *;
          `,
        },
      },
    },
    build: {
      target: 'esnext',
    },
  },

  eslint: {
    config: {
      stylistic: true,
    },
  },
})
