// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss', '@nuxt/eslint', '@vueuse/nuxt', '@vite-pwa/nuxt'],

  ssr: false,

  components: [
    {
      path: '~/components/common',
      pathPrefix: false,
    },
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
      path: '~/components/master',
      prefix: 'Master',
      pathPrefix: false,
    },
    {
      path: '~/components',
      pathPrefix: false,
      ignore: ['common/**', 'tool/**', 'portal/**', 'master/**'],
    },
  ],

  devtools: { enabled: false },

  app: {
    head: {
      meta: [
        { name: 'robots', content: 'noindex, nofollow, noarchive, nosnippet' },
        { name: 'googlebot', content: 'noindex, nofollow, noarchive, nosnippet' },
      ],
      script: [
        { src: '/theme-init.js' },
      ],
    },
  },
  css: [
    '@fontsource/noto-sans-jp/400.css',
    '@fontsource/noto-sans-jp/500.css',
    '@fontsource/noto-sans-jp/600.css',
    '@fontsource/noto-sans-jp/700.css',
    '@fontsource/roboto-mono/400.css',
    '@fontsource/roboto-mono/500.css',
    '@fontsource/roboto-mono/700.css',
    '~/assets/scss/style.scss',
  ],
  sourcemap: {
    server: false,
    client: false,
  },
  compatibilityDate: '2025-07-15',

  nitro: {
    prerender: {
      routes: ['/'],
    },
    routeRules: {
      '/**': {
        headers: {
          'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'SAMEORIGIN',
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
          'Cross-Origin-Opener-Policy': 'same-origin',
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
          'Content-Security-Policy': 'default-src \'self\'; script-src \'self\' \'unsafe-inline\' \'unsafe-eval\'; style-src \'self\' \'unsafe-inline\'; font-src \'self\' data:; img-src \'self\' data: blob: https:; connect-src \'self\'; worker-src \'self\' blob:; frame-ancestors \'self\';',
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
            @use "~/assets/scss/foundation/mixins/_states.scss" as *;
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

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Elec-Console - 現場DX総合試験コンソール',
      short_name: 'ElecConsole',
      description: '電気設備工事・受変電設備・送電前試験のための高信頼Webコンソール & 現場DXプラットフォーム',
      theme_color: '#0b0f19',
      background_color: '#0b0f19',
      display: 'standalone',
      orientation: 'any',
      start_url: '/',
      icons: [
        {
          src: '/icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: '/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    workbox: {
      navigateFallback: '/index.html',
      navigateFallbackDenylist: [/^\/api\/.*/],
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff,woff2}'],
      cleanupOutdatedCaches: true,
      runtimeCaching: [
        {
          urlPattern: /\/api\/.*/i,
          handler: 'NetworkOnly',
        },
      ],
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: false,
      type: 'module',
    },
  },

  tailwindcss: {
    viewer: false,
  },
})
