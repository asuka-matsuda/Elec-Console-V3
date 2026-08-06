import type { Meta, StoryObj } from '@storybook/vue3'
import AppFooter from './AppFooter.vue'

const meta = {
  title: 'Layout/AppFooter',
  component: AppFooter,
  tags: ['autodocs'],
  decorators: [
    (story) => ({
      components: { story },
      template: '<div style="min-height: 200px; display: flex; flex-direction: column; background: var(--color-bg-base);"><story /></div>',
    }),
  ],
} satisfies Meta<typeof AppFooter>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
