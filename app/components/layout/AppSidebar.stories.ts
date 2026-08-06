import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import AppSidebar from './AppSidebar.vue'

const meta = {
  title: 'Layout/AppSidebar',
  component: AppSidebar,
  tags: ['autodocs'],
  argTypes: {
    isOpen: { control: 'boolean' }
  },
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (story) => ({
      components: { story },
      template: '<div style="min-height: 100vh; background: var(--color-bg-base);"><story /></div>',
    }),
  ],
} satisfies Meta<typeof AppSidebar>

export default meta
type Story = StoryObj<typeof meta>

import { menuData } from '../../utils/menuData'

export const Default: Story = {
  render: (args) => ({
    components: { AppSidebar },
    setup() {
      const isOpen = ref(true) // For storybook, default it to true so it can be seen
      return { args, isOpen }
    },
    template: `
      <AppSidebar v-model:isOpen="isOpen" :menuData="args.menuData" />
    `,
  }),
  args: {
    menuData: menuData,
  },
}
