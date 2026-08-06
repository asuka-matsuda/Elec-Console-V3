import type { Meta, StoryObj } from '@storybook/vue3'
import AppBadge from './AppBadge.vue'

const meta = {
  title: 'Components/AppBadge',
  component: AppBadge,
  tags: ['autodocs'],
  argTypes: {
    variant: { 
      control: 'select', 
      options: ['neutral', 'primary', 'success', 'warning', 'danger', 'tool', 'database', 'reference', 'management'] 
    },
    size: {
      control: 'select',
      options: ['sm', 'md']
    },
    glow: {
      control: 'boolean'
    },
    default: {
      control: 'text',
      description: 'Slot content'
    }
  },
  decorators: [
    (story) => ({
      components: { story },
      template: '<div style="padding: 2rem; background: var(--color-bg-base); display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;"><story /></div>',
    }),
  ],
} satisfies Meta<typeof AppBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { AppBadge },
    setup() {
      return { args }
    },
    template: '<AppBadge v-bind="args">{{ args.default }}</AppBadge>',
  }),
  args: {
    variant: 'neutral',
    size: 'md',
    glow: false,
    default: 'Default Badge',
  },
}

export const Variants: Story = {
  render: () => ({
    components: { AppBadge },
    template: `
      <AppBadge variant="neutral">Neutral</AppBadge>
      <AppBadge variant="primary">Primary</AppBadge>
      <AppBadge variant="success">Success</AppBadge>
      <AppBadge variant="warning">Warning</AppBadge>
      <AppBadge variant="danger">Danger</AppBadge>
      <AppBadge variant="tool">Tool</AppBadge>
      <AppBadge variant="database">Database</AppBadge>
      <AppBadge variant="reference">Reference</AppBadge>
      <AppBadge variant="management">Management</AppBadge>
    `,
  }),
}

export const Sizes: Story = {
  render: () => ({
    components: { AppBadge },
    template: `
      <AppBadge size="sm">Small Badge</AppBadge>
      <AppBadge size="md">Medium Badge</AppBadge>
    `,
  }),
}

export const GlowEffect: Story = {
  render: () => ({
    components: { AppBadge },
    template: `
      <AppBadge variant="primary" glow>Glowing Primary</AppBadge>
      <AppBadge variant="danger" glow>Glowing Danger</AppBadge>
      <AppBadge variant="success" glow>Glowing Success</AppBadge>
    `,
  }),
}
