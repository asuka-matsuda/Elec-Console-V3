import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import MoleculesSectionHeader from '../../app/components/MoleculesSectionHeader.vue'

describe('MoleculesSectionHeader.vue', () => {
  it('renders default title and lg size class', () => {
    const wrapper = mount(MoleculesSectionHeader, {
      props: {
        title: 'テスト見出し',
      },
    })

    expect(wrapper.text()).toContain('テスト見出し')
    const title = wrapper.find('.title')

    expect(title.classes()).toContain('is-lg')
    expect(title.classes()).not.toContain('is-md')
  })

  it('renders md size class when size="md"', () => {
    const wrapper = mount(MoleculesSectionHeader, {
      props: {
        title: '中見出し',
        size: 'md',
      },
    })

    const title = wrapper.find('.title')

    expect(title.classes()).toContain('is-md')
    expect(title.classes()).not.toContain('is-lg')
  })

  it('renders sm and xs size classes correctly', () => {
    const wrapperSm = mount(MoleculesSectionHeader, {
      props: {
        title: '小見出し',
        size: 'sm',
      },
    })

    expect(wrapperSm.find('.title').classes()).toContain('is-sm')

    const wrapperXs = mount(MoleculesSectionHeader, {
      props: {
        title: '極小見出し',
        size: 'xs',
      },
    })

    expect(wrapperXs.find('.title').classes()).toContain('is-xs')

    const wrapperXl = mount(MoleculesSectionHeader, {
      props: {
        title: '特大見出し',
        size: 'xl',
      },
    })

    expect(wrapperXl.find('.title').classes()).toContain('is-xl')
  })

  it('passes animated=true and theme accent color to divider by default', () => {
    const wrapper = mount(MoleculesSectionHeader, {
      props: {
        title: '見出し',
      },
    })

    const divider = wrapper.find('hr')

    expect(divider.exists()).toBe(true)
    expect(divider.classes()).toContain('is-animated')
    expect(divider.attributes('style')).toContain('--divider-color: var(--theme-accent)')
  })

  it('passes animated=false and border color to divider when variant="border"', () => {
    const wrapper = mount(MoleculesSectionHeader, {
      props: {
        title: '境界見出し',
        variant: 'border',
      },
    })

    const divider = wrapper.find('hr')

    expect(divider.exists()).toBe(true)
    expect(divider.classes()).not.toContain('is-animated')
    expect(divider.attributes('style')).toContain('--divider-color: var(--color-border)')
  })
})
