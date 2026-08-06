import type { Meta, StoryObj } from '@storybook/vue3'
import AppCheckbox from './AppCheckbox.vue'
import { ref } from 'vue'

const meta = {
  title: 'Components/AppCheckbox',
  component: AppCheckbox,
  tags: ['autodocs'],
  argTypes: {
    modelValue: { control: 'boolean' },
    label: { control: 'text' },
    color: { 
      control: 'select', 
      options: ['primary', 'success', 'danger', 'warning'] 
    },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof AppCheckbox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { AppCheckbox },
    setup() {
      const isChecked = ref(false)
      return { args, isChecked }
    },
    template: `
      <div>
        <AppCheckbox v-bind="args" v-model="isChecked" />
        <div style="margin-top: 1rem; color: var(--color-text-muted);">
          Checked: {{ isChecked }}
        </div>
      </div>
    `,
  }),
  args: {
    label: 'I accept the terms and conditions',
  },
}

export const Colors: Story = {
  render: (args) => ({
    components: { AppCheckbox },
    setup() {
      return { args }
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <AppCheckbox :modelValue="true" color="primary" label="Primary Checkbox" />
        <AppCheckbox :modelValue="true" color="success" label="Success Checkbox" />
        <AppCheckbox :modelValue="true" color="danger" label="Danger Checkbox" />
        <AppCheckbox :modelValue="true" color="warning" label="Warning Checkbox" />
      </div>
    `,
  }),
}

export const ArrayBinding: Story = {
  render: (args) => ({
    components: { AppCheckbox },
    setup() {
      const selectedItems = ref(['item1'])
      return { args, selectedItems }
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <AppCheckbox v-model="selectedItems" value="item1" label="Item 1" />
        <AppCheckbox v-model="selectedItems" value="item2" label="Item 2" />
        <AppCheckbox v-model="selectedItems" value="item3" label="Item 3" />
        
        <div style="margin-top: 1rem; color: var(--color-text-muted);">
          Selected: {{ selectedItems }}
        </div>
      </div>
    `,
  }),
}

export const Disabled: Story = {
  render: (args) => ({
    components: { AppCheckbox },
    setup() {
      return { args }
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <AppCheckbox disabled label="Disabled (Unchecked)" />
        <AppCheckbox disabled :modelValue="true" label="Disabled (Checked)" />
      </div>
    `,
  }),
}
