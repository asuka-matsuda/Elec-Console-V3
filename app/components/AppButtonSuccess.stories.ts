import type { Meta, StoryObj } from '@storybook/vue3'
import AppButtonSuccess from './AppButtonSuccess.vue'

const meta = {
  title: 'Components/AppButtonSuccess',
  component: AppButtonSuccess,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    block: { control: 'boolean' },
    disabled: { control: 'boolean' },
    default: { control: 'text', description: 'Slot content' }
  },
  args: {
    default: 'Success Button',
  },
} satisfies Meta<typeof AppButtonSuccess>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { AppButtonSuccess },
    setup() { return { args } },
    template: '<AppButtonSuccess v-bind="args">{{ args.default }}</AppButtonSuccess>',
  }),
}
