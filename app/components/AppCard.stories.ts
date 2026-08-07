import type { Meta, StoryObj } from '@storybook/vue3'
import AppCard from './AppCard.vue'

const meta = {
  title: 'Components/AppCard',
  component: AppCard,
  tags: ['autodocs'],
  decorators: [
    (story) => ({
      components: { story },
      template: '<div style="padding: 2rem; background: var(--color-bg-base);"><story /></div>',
    }),
  ],
} satisfies Meta<typeof AppCard>

export default meta
type Story = StoryObj<typeof meta>

export const DefaultFlat: Story = {
  render: (args) => ({
    components: { AppCard },
    setup() {
      return { args }
    },
    template: `
      <AppCard v-bind="args">
        <h3 style="margin-top: 0; color: var(--color-text-main);">Card Title</h3>
        <p style="color: var(--color-text-muted);">
          This is a default flat card. It uses a subtle glass background and border without shadow effects.
          Perfect for form wrappers, nested settings, or subtle groupings.
        </p>
      </AppCard>
    `,
  }),
}



