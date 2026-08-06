import type { Meta, StoryObj } from '@storybook/vue3'
import AppFormGroup from './AppFormGroup.vue'
import AppInput from './AppInput.vue'
import AppSelect from './AppSelect.vue'

const meta = {
  title: 'Components/AppFormGroup',
  component: AppFormGroup,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    required: { control: 'boolean' },
    error: { control: 'text' },
    help: { control: 'text' },
    horizontal: { control: 'boolean' },
  },
  decorators: [
    (story) => ({
      components: { story },
      template: '<div style="padding: 2rem; background: var(--color-bg-base); max-width: 600px;"><story /></div>',
    }),
  ],
} satisfies Meta<typeof AppFormGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { AppFormGroup, AppInput },
    setup() {
      return { args }
    },
    template: `
      <AppFormGroup v-bind="args">
        <AppInput placeholder="Enter your username..." />
      </AppFormGroup>
    `,
  }),
  args: {
    label: 'Username',
    required: false,
    help: 'This will be displayed on your public profile.',
  },
}

export const RequiredWithError: Story = {
  render: (args) => ({
    components: { AppFormGroup, AppInput },
    setup() {
      return { args }
    },
    template: `
      <AppFormGroup v-bind="args">
        <AppInput error placeholder="Enter a secure password..." type="password" />
      </AppFormGroup>
    `,
  }),
  args: {
    label: 'Password',
    required: true,
    error: 'Password must be at least 8 characters long.',
  },
}

export const HorizontalLayout: Story = {
  render: (args) => ({
    components: { AppFormGroup, AppInput, AppSelect },
    setup() {
      return { args }
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <AppFormGroup v-bind="args" label="First Name">
          <AppInput placeholder="John" />
        </AppFormGroup>
        
        <AppFormGroup v-bind="args" label="Role" required>
          <AppSelect 
            :options="[
              { label: 'Admin', value: 'admin' },
              { label: 'User', value: 'user' }
            ]" 
            placeholder="Select a role..." 
          />
        </AppFormGroup>
      </div>
    `,
  }),
  args: {
    horizontal: true,
  },
}
