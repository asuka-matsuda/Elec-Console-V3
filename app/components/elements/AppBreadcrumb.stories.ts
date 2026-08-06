import type { Meta, StoryObj } from '@storybook/vue3'
import AppBreadcrumb from './AppBreadcrumb.vue'

const meta = {
  title: 'Elements/AppBreadcrumb',
  component: AppBreadcrumb,
  tags: ['autodocs'],
} satisfies Meta<typeof AppBreadcrumb>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    items: [
      { text: 'Home', href: '/' },
      { text: 'Dashboard', href: '/dashboard' },
      { text: 'System Status' }
    ]
  },
}

export const TwoLevels: Story = {
  args: {
    items: [
      { text: 'Settings', href: '/settings' },
      { text: 'Profile' }
    ]
  },
}
