import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import AppTabs from './AppTabs.vue'

const meta = {
  title: 'Components/AppTabs',
  component: AppTabs,
  tags: ['autodocs'],
  argTypes: {
    options: { control: 'object' },
    vertical: { control: 'boolean' },
    grid: { control: 'boolean' },
  },
  decorators: [
    (story) => ({
      components: { story },
      template: '<div style="padding: 2rem; background: var(--color-main-bg); max-width: var(--width-md);"><story /></div>',
    }),
  ],
} satisfies Meta<typeof AppTabs>

export default meta
type Story = StoryObj<typeof meta>

const defaultOptions = [
  { label: 'General', value: 'general' },
  { label: 'Security', value: 'security' },
  { label: 'Notifications', value: 'notifications' },
  { label: 'Advanced', value: 'advanced', disabled: true },
]

export const Default: Story = {
  render: (args) => ({
    components: { AppTabs },
    setup() {
      const activeTab = ref('general')
      return { args, activeTab }
    },
    template: `
      <div>
        <AppTabs v-model="activeTab" v-bind="args" />
        <div style="margin-top: 2rem; color: var(--color-text-main); font-family: var(--font-mono);">
          Active Tab: {{ activeTab }}
        </div>
      </div>
    `,
  }),
  args: {
    options: defaultOptions,
    vertical: false,
    grid: false,
  },
}

export const Vertical: Story = {
  render: (args) => ({
    components: { AppTabs },
    setup() {
      const activeTab = ref('security')
      return { args, activeTab }
    },
    template: `
      <div style="display: flex; gap: 2rem;">
        <div style="width: 200px;">
          <AppTabs v-model="activeTab" v-bind="args" />
        </div>
        <div style="flex: 1; padding: 2rem; border: 1px solid var(--color-border); color: var(--color-text-main);">
          Content for {{ activeTab }}
        </div>
      </div>
    `,
  }),
  args: {
    options: defaultOptions,
    vertical: true,
  },
}

export const Grid: Story = {
  render: (args) => ({
    components: { AppTabs },
    setup() {
      const activeTab = ref('general')
      return { args, activeTab }
    },
    template: `
      <div>
        <AppTabs v-model="activeTab" v-bind="args" />
      </div>
    `,
  }),
  args: {
    options: defaultOptions,
    grid: true,
  },
}
