import type { Meta, StoryObj } from '@storybook/vue3'
import AppToggle from './AppToggle.vue'
import { ref } from 'vue'

const meta = {
  title: 'Components/AppToggle',
  component: AppToggle,
  tags: ['autodocs'],
  argTypes: {
    modelValue: { control: 'boolean' },
    label: { control: 'text' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof AppToggle>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { AppToggle },
    setup() {
      const isEnabled = ref(false)
      return { args, isEnabled }
    },
    template: `
      <div>
        <AppToggle v-bind="args" v-model="isEnabled" />
        <div style="margin-top: 1rem; color: var(--color-text-muted);">
          State: {{ isEnabled ? 'ON' : 'OFF' }}
        </div>
      </div>
    `,
  }),
  args: {
    label: 'Enable Dark Mode',
  },
}

export const Disabled: Story = {
  render: (args) => ({
    components: { AppToggle },
    setup() {
      return { args }
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <AppToggle disabled label="Disabled (OFF)" />
        <AppToggle disabled :modelValue="true" label="Disabled (ON)" />
      </div>
    `,
  }),
}
