import type { Meta, StoryObj } from '@storybook/vue3'
import AppPanel from './AppPanel.vue'

const meta = {
  title: 'Components/AppPanel',
  component: AppPanel,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    bracketColor: { 
      control: 'select',
      options: ['main', 'tool', 'database', 'reference', 'management']
    },
    variant: {
      control: 'select',
      options: ['hud', 'simple', 'gradient', 'hybrid']
    }
  },
  decorators: [
    (story) => ({
      components: { story },
      template: '<div style="padding: 2rem; background: var(--color-bg-base);"><story /></div>',
    }),
  ],
} satisfies Meta<typeof AppPanel>

export default meta
type Story = StoryObj<typeof meta>

export const DefaultHUD: Story = {
  render: (args) => ({
    components: { AppPanel },
    setup() {
      return { args }
    },
    template: `
      <AppPanel v-bind="args">
        <p style="color: var(--color-text-muted); margin: 0;">
          This is the HUD panel style. It features subtle corner brackets and an inner glowing shadow.
          Perfect for main dashboard blocks.
        </p>
      </AppPanel>
    `,
  }),
  args: {
    title: 'System Status',
    variant: 'hud',
    bracketColor: 'main',
  },
}

export const Simple: Story = {
  render: (args) => ({
    components: { AppPanel },
    setup() {
      return { args }
    },
    template: `
      <AppPanel v-bind="args">
        <p style="color: var(--color-text-muted); margin: 0;">
          The simple variant removes the corner brackets and uses a softer inset shadow.
        </p>
      </AppPanel>
    `,
  }),
  args: {
    title: 'Simple Panel',
    variant: 'simple',
    bracketColor: 'main',
  },
}

export const Gradient: Story = {
  render: (args) => ({
    components: { AppPanel },
    setup() {
      return { args }
    },
    template: `
      <AppPanel v-bind="args">
        <p style="color: var(--color-text-muted); margin: 0;">
          The gradient variant uses a diagonal gradient border for a sleeker look.
        </p>
      </AppPanel>
    `,
  }),
  args: {
    title: 'Gradient Panel',
    variant: 'gradient',
    bracketColor: 'tool',
  },
}

export const Hybrid: Story = {
  render: (args) => ({
    components: { AppPanel },
    setup() {
      return { args }
    },
    template: `
      <AppPanel v-bind="args">
        <p style="color: var(--color-text-muted); margin: 0;">
          Hybrid combines the HUD inner shadow with the gradient border, plus a glowing drop-shadow on the corner brackets.
        </p>
      </AppPanel>
    `,
  }),
  args: {
    title: 'Hybrid Panel',
    variant: 'hybrid',
    bracketColor: 'database',
  },
}

export const ColorVariants: Story = {
  render: (args) => ({
    components: { AppPanel },
    setup() {
      return { args }
    },
    template: `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
        <AppPanel variant="hybrid" bracketColor="main" title="Main Color">
          <p style="color: var(--color-text-muted);">Main theme color glow.</p>
        </AppPanel>
        <AppPanel variant="hybrid" bracketColor="tool" title="Tool Color">
          <p style="color: var(--color-text-muted);">Tool category glow.</p>
        </AppPanel>
        <AppPanel variant="hybrid" bracketColor="database" title="Database Color">
          <p style="color: var(--color-text-muted);">Database category glow.</p>
        </AppPanel>
        <AppPanel variant="hybrid" bracketColor="management" title="Management Color">
          <p style="color: var(--color-text-muted);">Management category glow.</p>
        </AppPanel>
      </div>
    `,
  }),
}
