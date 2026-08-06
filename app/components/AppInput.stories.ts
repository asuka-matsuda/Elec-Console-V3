import type { Meta, StoryObj } from '@storybook/vue3'
import AppInput from './AppInput.vue'
import { ref } from 'vue'

const meta = {
  title: 'Components/AppInput',
  component: AppInput,
  tags: ['autodocs'],
  argTypes: {
    modelValue: { control: 'text' },
    type: { 
      control: 'select', 
      options: ['text', 'password', 'email', 'number', 'search', 'tel', 'url', 'textarea'] 
    },
    placeholder: { control: 'text' },
    size: { 
      control: 'select', 
      options: ['sm', 'md', 'lg'] 
    },
    disabled: { control: 'boolean' },
    error: { control: 'boolean' },
  },
} satisfies Meta<typeof AppInput>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { AppInput },
    setup() {
      const inputValue = ref('')
      return { args, inputValue }
    },
    template: `
      <div style="width: 300px;">
        <AppInput v-bind="args" v-model="inputValue" />
        <div style="margin-top: 1rem; color: var(--color-text-muted);">
          Input Value: {{ inputValue }}
        </div>
      </div>
    `,
  }),
  args: {
    placeholder: 'Enter text...',
  },
}

export const Sizes: Story = {
  render: (args) => ({
    components: { AppInput },
    setup() {
      return { args }
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 300px;">
        <AppInput size="sm" placeholder="Small input (sm)" />
        <AppInput size="md" placeholder="Medium input (md)" />
        <AppInput size="lg" placeholder="Large input (lg)" />
      </div>
    `,
  }),
}

export const Types: Story = {
  render: (args) => ({
    components: { AppInput },
    setup() {
      return { args }
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 300px;">
        <AppInput type="text" placeholder="Text input" />
        <AppInput type="password" placeholder="Password input" />
        <AppInput type="number" placeholder="Number input" />
        <AppInput type="email" placeholder="Email input" />
      </div>
    `,
  }),
}

export const Disabled: Story = {
  render: (args) => ({
    components: { AppInput },
    setup() {
      return { args }
    },
    template: `
      <div style="width: 300px;">
        <AppInput v-bind="args" />
      </div>
    `,
  }),
  args: {
    placeholder: 'This input is disabled',
    disabled: true,
  },
}

export const ErrorState: Story = {
  render: (args) => ({
    components: { AppInput },
    setup() {
      const inputValue = ref('Invalid data')
      return { args, inputValue }
    },
    template: `
      <div style="width: 300px;">
        <AppInput v-bind="args" v-model="inputValue" />
      </div>
    `,
  }),
  args: {
    error: true,
  },
}

export const Textarea: Story = {
  render: (args) => ({
    components: { AppInput },
    setup() {
      const inputValue = ref('This is a multiline textarea.\nIt uses the exact same styling as the standard input!')
      return { args, inputValue }
    },
    template: `
      <div style="width: 400px;">
        <AppInput v-bind="args" v-model="inputValue" />
      </div>
    `,
  }),
  args: {
    type: 'textarea',
    rows: 5,
  },
}
