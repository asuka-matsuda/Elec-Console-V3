import type { StorybookConfig } from '@storybook/vue3-vite';

const config: StorybookConfig = {
  "stories": [
    "../app/**/*.mdx",
    "../app/**/*.stories.@(js|jsx|ts|tsx|mdx)"
  ],
  "addons": [
    "@storybook/addon-a11y",
    "@storybook/addon-docs"
  ],
  "framework": {
    name: "@storybook/vue3-vite",
    options: {}
  },
  async viteFinal(config) {
    const { mergeConfig } = await import('vite');
    const path = await import('path');
    const vue = (await import('@vitejs/plugin-vue')).default;
    return mergeConfig(config, {
      plugins: [vue()],
      resolve: {
        alias: {
          '~': path.resolve(__dirname, '../app/')
        }
      },
      css: {
        preprocessorOptions: {
          scss: {
            additionalData: '@use "~/assets/scss/foundation/_variables.scss" as *; @use "~/assets/scss/foundation/_mixins.scss" as *; @use "~/assets/scss/foundation/_functions.scss" as *;'
          }
        }
      }
    });
  }
};
export default config;