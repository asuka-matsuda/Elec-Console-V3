// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: ['@nuxtjs/tailwindcss', '@nuxt/eslint', '@vueuse/nuxt'],

  components: [
    {
      path: '~/components/tool',
      prefix: 'Tool',
      pathPrefix: false,
    },
    {
      path: '~/components/portal',
      prefix: 'Portal',
      pathPrefix: false,
    },
    {
      path: '~/components/database',
      prefix: 'Db',
      pathPrefix: false,
    },
    {
      path: '~/components',
      pathPrefix: false,
      ignore: ['tool/**', 'portal/**', 'database/**'],
    },
  ],
  devtools: { enabled: true },

  app: {
    head: {
      meta: [
        { name: 'robots', content: 'noindex, nofollow, noarchive, nosnippet' },
        { name: 'googlebot', content: 'noindex, nofollow, noarchive, nosnippet' },
      ],
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

  nitro: {
    routeRules: {
      '/**': {
        headers: {
          'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'SAMEORIGIN',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
          'Cross-Origin-Opener-Policy': 'same-origin',
        },
      },
    },
  },

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @use "~/assets/scss/foundation/mixins/_layout.scss" as *;
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
