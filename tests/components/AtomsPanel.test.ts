import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AtomsPanel from '../../app/components/AtomsPanel.vue'

describe('AtomsPanel.vue', () => {
  it('renders default section element with panel class and slot content', () => {
    const wrapper = mount(AtomsPanel, {
      slots: {
        default: '<span>Panel content</span>',
      },
    })

    expect(wrapper.element.tagName.toLowerCase()).toBe('section')
    expect(wrapper.classes()).toContain('panel')
    expect(wrapper.classes()).not.toContain('is-interactive')
    expect(wrapper.classes()).not.toContain('is-selected')
    expect(wrapper.classes()).not.toContain('is-disabled')
    expect(wrapper.text()).toContain('Panel content')
  })

  it('renders custom element via as prop', () => {
    const wrapper = mount(AtomsPanel, {
      props: {
        as: 'div',
      },
    })

    expect(wrapper.element.tagName.toLowerCase()).toBe('div')
    expect(wrapper.classes()).toContain('panel')
  })

  it('applies is-interactive class when interactive is true', () => {
    const wrapper = mount(AtomsPanel, {
      props: {
        interactive: true,
      },
    })

    expect(wrapper.classes()).toContain('is-interactive')
  })

  it('applies is-selected class when selected is true', () => {
    const wrapper = mount(AtomsPanel, {
      props: {
        selected: true,
      },
    })

    expect(wrapper.classes()).toContain('is-selected')
  })

  it('applies is-disabled class when disabled is true', () => {
    const wrapper = mount(AtomsPanel, {
      props: {
        disabled: true,
      },
    })

    expect(wrapper.classes()).toContain('is-disabled')
  })

  it('applies multiple state classes in combination', () => {
    const wrapper = mount(AtomsPanel, {
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
})
