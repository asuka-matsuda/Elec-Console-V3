import type { Meta, StoryObj } from '@storybook/vue3'
import AppHeader from './AppHeader.vue'

const meta = {
  title: 'Layout/AppHeader',
  component: AppHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (story) => ({
      components: { story },
      template: '<div style="min-height: 100vh; background: var(--color-bg-base);"><story /></div>',
    }),
  ],
} satisfies Meta<typeof AppHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { AppHeader },
    setup() {
      return { args }
    },
    template: `
      <AppHeader v-bind="args">
        <template #actions>
          <div style="color: var(--color-text-main); font-family: var(--font-base);">Admin User</div>
        </template>
      </AppHeader>
    `,
  }),
  args: {
    breadcrumbs: [
      { text: 'Home', href: '/' },
      { text: 'Dashboard' }
    ]
  },
}
