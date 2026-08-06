import type { Meta, StoryObj } from '@storybook/vue3'
import AppDivider from './AppDivider.vue'

const meta = {
  title: 'Components/AppDivider',
  component: AppDivider,
  tags: ['autodocs'],
  argTypes: {
    vertical: { control: 'boolean' },
    animated: { control: 'boolean' },
  },
  decorators: [
    (story) => ({
      components: { story },
      template: '<div style="padding: 2rem; background: var(--color-bg-base); min-height: 200px;"><story /></div>',
    }),
  ],
} satisfies Meta<typeof AppDivider>

export default meta
type Story = StoryObj<typeof meta>

export const DefaultHorizontal: Story = {
  render: (args) => ({
    components: { AppDivider },
    setup() {
      return { args }
    },
    template: `
      <div>
        <div style="color: var(--color-text-muted);">Content Above</div>
        <AppDivider v-bind="args" />
        <div style="color: var(--color-text-muted);">Content Below</div>
      </div>
    `,
  }),
  args: {
    vertical: false,
    animated: true,
  },
}

export const StaticHorizontal: Story = {
  render: (args) => ({
    components: { AppDivider },
    setup() {
      return { args }
    },
    template: `
      <div>
        <div style="color: var(--color-text-muted);">Content Above</div>
        <AppDivider v-bind="args" />
        <div style="color: var(--color-text-muted);">Content Below</div>
      </div>
    `,
  }),
  args: {
    vertical: false,
    animated: false,
  },
}

export const Vertical: Story = {
  render: (args) => ({
    components: { AppDivider },
    setup() {
      return { args }
    },
    template: `
      <div style="display: flex; height: 100px; align-items: center;">
        <div style="color: var(--color-text-muted);">Left</div>
        <AppDivider v-bind="args" />
        <div style="color: var(--color-text-muted);">Right</div>
      </div>
    `,
  }),
  args: {
    vertical: true,
    animated: true,
  },
}
