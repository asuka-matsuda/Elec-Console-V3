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
        {
          innerHTML: `
            (function() {
              try {
                const getVal = function(k, d) {
                  const v = localStorage.getItem(k);
                  if (v === null) return d;
                  try { return JSON.parse(v); } catch(e) { return v; }
                };
                const t = getVal('elec_theme_mode', 'dark');
                const b = getVal('elec_base_bg_style', 'solid');
                document.documentElement.setAttribute('data-theme', t);
                document.documentElement.setAttribute('data-base-bg', b);
                const css = ':root {' +
                  '--bg-solid-color: ' + getVal('elec_solid_color', '#0f172a') + ';' +
                  '--bg-gradient-c1: ' + getVal('elec_gradient_c1', '#1e293b') + ';' +
                  '--bg-gradient-c2: ' + getVal('elec_gradient_c2', '#0f172a') + ';' +
                  '--bg-aurora-c1: ' + getVal('elec_aurora_c1', '#3b82f6') + ';' +
                  '--bg-aurora-c2: ' + getVal('elec_aurora_c2', '#8b5cf6') + ';' +
                  '--bg-aurora-c3: ' + getVal('elec_aurora_c3', '#ec4899') + ';' +
                  '--bg-aurora-c4: ' + getVal('elec_aurora_c4', '#06b6d4') + ';' +
                  '--bg-grid-color: ' + getVal('elec_grid_color', '#334155') + ';' +
                  '--bg-grid-spacing: ' + getVal('elec_grid_spacing', 32) + 'px;' +
                '}';
                const s = document.createElement('style');
                s.innerHTML = css;
                document.head.appendChild(s);
              } catch(e) {}
            })();
          `
        }
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

  modules: ['@nuxt/eslint', '@vueuse/nuxt']
})