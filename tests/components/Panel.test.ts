import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Panel from '../../app/components/common/atoms/Panel.vue'

describe('Panel.vue', () => {
  it('renders default div with normal padding', () => {
    const wrapper = mount(Panel, {
      slots: { default: '<span>Content</span>' },
    })

    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.classes()).toContain('panel')
    expect(wrapper.classes()).toContain('p-panel-pad')
    expect(wrapper.text()).toBe('Content')
  })

  it('renders as custom element specified by as prop', () => {
    const wrapper = mount(Panel, {
      props: { as: 'section' },
    })

    expect(wrapper.element.tagName).toBe('SECTION')
  })

  it('applies padding variants correctly', async () => {
    const wrapper = mount(Panel, {
      props: { padding: 'compact' },
    })

    expect(wrapper.classes()).toContain('p-panel-pad-compact')
    expect(wrapper.classes()).not.toContain('p-panel-pad')

    await wrapper.setProps({ padding: 'none' })
    expect(wrapper.classes()).toContain('p-0')
  })

  it('applies state classes for interactive, active, and disabled', () => {
    const wrapper = mount(Panel, {
      props: {
        interactive: true,
        active: true,
        disabled: true,
      },
    })

    expect(wrapper.classes()).toContain('is-interactive')
    expect(wrapper.classes()).toContain('is-active')
    expect(wrapper.classes()).toContain('is-disabled')
  })
})
