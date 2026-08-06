import type { Meta, StoryObj } from '@storybook/vue3'
import AppRadioGroup from './AppRadioGroup.vue'
import { ref } from 'vue'
import { TOGGLE_OPTIONS, PHASE_STATUS_OPTIONS } from '../utils/constants'

const meta = {
  title: 'Components/AppRadioGroup',
  component: AppRadioGroup,
  tags: ['autodocs'],
  argTypes: {
    modelValue: { control: 'text' },
  },
} satisfies Meta<typeof AppRadioGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { AppRadioGroup },
    setup() {
      const selectedValue = ref(args.options[0].value)
      return { args, selectedValue }
    },
    template: `
      <div>
        <AppRadioGroup v-bind="args" v-model="selectedValue" />
        <div style="margin-top: 1rem; color: var(--color-text-muted);">
          Selected Value: {{ selectedValue }}
        </div>
      </div>
    `,
  }),
  args: {
    options: TOGGLE_OPTIONS,
  },
}

export const ThreeOptions: Story = {
  render: (args) => ({
    components: { AppRadioGroup },
    setup() {
      const selectedValue = ref(args.options[0].value)
      return { args, selectedValue }
    },
    template: `
      <div>
        <AppRadioGroup v-bind="args" v-model="selectedValue" />
        <div style="margin-top: 1rem; color: var(--color-text-muted);">
          Selected Value: {{ selectedValue }}
        </div>
      </div>
    `,
  }),
  args: {
    options: PHASE_STATUS_OPTIONS,
  },
}

export const WithDisabledOption: Story = {
  render: (args) => ({
    components: { AppRadioGroup },
    setup() {
      const selectedValue = ref(args.options[0].value)
      return { args, selectedValue }
    },
    template: `
      <div>
        <AppRadioGroup v-bind="args" v-model="selectedValue" />
        <div style="margin-top: 1rem; color: var(--color-text-muted);">
          Selected Value: {{ selectedValue }}
        </div>
      </div>
    `,
  }),
  args: {
    options: [
      { label: 'Option A', value: 'a' },
      { label: 'Option B (Disabled)', value: 'b', disabled: true },
      { label: 'Option C', value: 'c' },
    ],
  },
}
