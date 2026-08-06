import type { Preview } from '@storybook/vue3'
import { setup } from '@storybook/vue3'
import '../app/assets/scss/style.scss'

setup((app) => {
  app.component('NuxtLink', {
    props: ['to'],
    template: '<a :href="to"><slot /></a>'
  })
})

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
  },
};

export default preview;