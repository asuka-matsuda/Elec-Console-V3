import type { Meta, StoryObj } from '@storybook/vue3'
import AppButton from './AppButton.vue'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories
const meta = {
  title: 'Components/AppButton',
  component: AppButton,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    align: {
      control: 'select',
      options: ['left', 'center', 'right'],
    },
    block: { control: 'boolean' },
    iconOnly: { control: 'boolean' },
    disabled: { control: 'boolean' },
    default: { control: 'text', description: 'Slot content' }
  },
  args: {
    default: 'Button Text',
  },
} satisfies Meta<typeof AppButton>

export default meta
type Story = StoryObj<typeof meta>

// Define a template to render the slot content correctly in Vue 3 Storybook
export const Primary: Story = {
  render: (args) => ({
    components: { AppButton },
    setup() {
      return { args }
    },
    template: '<AppButton v-bind="args">{{ args.default }}</AppButton>',
  }),
}

export const Small: Story = {
  ...Primary,
  args: {
    ...Primary.args,
    size: 'sm',
  },
}

export const Medium: Story = {
  ...Primary,
  args: {
    ...Primary.args,
    size: 'md',
  },
}

export const Large: Story = {
  ...Primary,
  args: {
    ...Primary.args,
    size: 'lg',
  },
}

export const Block: Story = {
  ...Primary,
  args: {
    ...Primary.args,
    block: true,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
}

export const Disabled: Story = {
  ...Primary,
  args: {
    ...Primary.args,
    disabled: true,
  },
}
