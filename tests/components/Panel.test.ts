import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, markRaw } from 'vue'

import Panel from '../../app/components/common/atoms/Panel.vue'

describe('Panel.vue', () => {
  it('renders default div element with panel class, hidden overflow, and slot content', () => {
    const wrapper = mount(Panel, {
      slots: {
        default: '<span>Panel content</span>',
      },
    })

    expect(wrapper.element.tagName.toLowerCase()).toBe('div')
    expect(wrapper.classes()).toContain('panel')
    expect(wrapper.classes()).toContain('overflow-hidden')
    expect(wrapper.classes()).not.toContain('is-interactive')
    expect(wrapper.classes()).not.toContain('is-selected')
    expect(wrapper.classes()).not.toContain('is-disabled')
    expect(wrapper.text()).toContain('Panel content')
  })

  it('renders custom element via as prop', () => {
    const wrapper = mount(Panel, {
      props: {
        as: 'section',
      },
    })

    expect(wrapper.element.tagName.toLowerCase()).toBe('section')
    expect(wrapper.classes()).toContain('panel')
  })

  it('applies overflow class based on overflow prop', () => {
    const wrapperVisible = mount(Panel, {
      props: {
        overflow: 'visible',
      },
    })

    expect(wrapperVisible.classes()).toContain('overflow-visible')

    const wrapperAuto = mount(Panel, {
      props: {
        overflow: 'auto',
      },
    })

    expect(wrapperAuto.classes()).toContain('overflow-auto')
  })

  it('applies is-interactive class when interactive is true', () => {
    const wrapper = mount(Panel, {
      props: {
        interactive: true,
      },
    })

    expect(wrapper.classes()).toContain('is-interactive')
  })

  it('applies is-selected class when selected is true', () => {
    const wrapper = mount(Panel, {
      props: {
        selected: true,
      },
    })

    expect(wrapper.classes()).toContain('is-selected')
  })

  it('applies is-disabled class when disabled is true', () => {
    const wrapper = mount(Panel, {
      props: {
        disabled: true,
      },
    })

    expect(wrapper.classes()).toContain('is-disabled')
  })

  it('applies multiple state classes in combination', () => {
    const wrapper = mount(Panel, {
      props: {
        interactive: true,
        selected: true,
        disabled: true,
      },
    })

    expect(wrapper.classes()).toContain('is-interactive')
    expect(wrapper.classes()).toContain('is-selected')
    expect(wrapper.classes()).toContain('is-disabled')
  })

  it('passes through fallthrough attributes such as custom class and data attributes', () => {
    const wrapper = mount(Panel, {
      attrs: {
        'id': 'custom-panel-id',
        'class': 'custom-panel-class p-0',
        'data-testid': 'custom-panel',
      },
    })

    expect(wrapper.attributes('id')).toBe('custom-panel-id')
    expect(wrapper.attributes('data-testid')).toBe('custom-panel')
    expect(wrapper.classes()).toContain('panel')
    expect(wrapper.classes()).toContain('custom-panel-class')
    expect(wrapper.classes()).toContain('p-0')
  })

  it('renders component object via as prop', () => {
    const DummyComponent = defineComponent({
      name: 'DummyComponent',
      template: '<article class="dummy-component"><slot /></article>',
    })

    const wrapper = mount(Panel, {
      props: {
        as: markRaw(DummyComponent),
      },
      slots: {
        default: 'Custom content',
      },
    })

    expect(wrapper.findComponent(DummyComponent).exists()).toBe(true)
    expect(wrapper.classes()).toContain('panel')
    expect(wrapper.text()).toContain('Custom content')
  })

  it('emits click event on click via fallthrough listener', async () => {
    const onClick = vi.fn()
    const wrapper = mount(Panel, {
      attrs: {
        onClick,
      },
    })

    await wrapper.trigger('click')

    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
