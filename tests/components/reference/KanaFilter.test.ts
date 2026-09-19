import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import KanaFilter from '../../../app/components/reference/KanaFilter.vue'
import type { KanaRowKey } from '../../../app/utils/kana'

describe('KanaFilter.vue (app/components/reference/KanaFilter.vue)', () => {
  it('renders all 10 kana row buttons', () => {
    const wrapper = mount(KanaFilter)
    const buttons = wrapper.findAll('button.kana-btn')

    expect(buttons).toHaveLength(10)
    const labels = buttons.map(b => b.text())

    expect(labels).toEqual(['あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら', 'わ他'])
  })

  it('applies is-active class to selected rows', () => {
    const wrapper = mount(KanaFilter, {
      props: {
        modelValue: ['a', 's'] as KanaRowKey[],
      },
    })

    const buttons = wrapper.findAll('button.kana-btn')

    // 'あ' (index 0) and 'さ' (index 2) should be active
    expect(buttons[0].classes()).toContain('is-active')
    expect(buttons[1].classes()).not.toContain('is-active')
    expect(buttons[2].classes()).toContain('is-active')
  })

  it('toggles row selection on button click', async () => {
    const wrapper = mount(KanaFilter, {
      props: {
        modelValue: ['a'] as KanaRowKey[],
      },
    })

    const buttons = wrapper.findAll('button.kana-btn')

    // Click 'か' (index 1) to add
    await buttons[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['a', 'k']])

    // Update prop to simulate v-model
    await wrapper.setProps({ modelValue: ['a', 'k'] })

    // Click 'あ' (index 0) to remove
    await buttons[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([['k']])
  })

  it('enables all buttons when availableRows is omitted', () => {
    const wrapper = mount(KanaFilter)
    const buttons = wrapper.findAll('button.kana-btn')

    buttons.forEach((btn) => {
      expect(btn.attributes('disabled')).toBeUndefined()
    })
  })

  it('disables buttons not included in availableRows', () => {
    const wrapper = mount(KanaFilter, {
      props: {
        availableRows: new Set(['a', 'k', 's']),
      },
    })

    const buttons = wrapper.findAll('button.kana-btn')

    expect(buttons[0].attributes('disabled')).toBeUndefined() // 'あ'
    expect(buttons[1].attributes('disabled')).toBeUndefined() // 'か'
    expect(buttons[2].attributes('disabled')).toBeUndefined() // 'さ'
    expect(buttons[3].attributes('disabled')).toBeDefined() // 'た'
    expect(buttons[9].attributes('disabled')).toBeDefined() // 'わ他'
  })

  it('enables "わ他" button when availableRows has "w" or "other"', () => {
    const wrapperWithW = mount(KanaFilter, {
      props: {
        availableRows: new Set(['w']),
      },
    })
    const buttonsWithW = wrapperWithW.findAll('button.kana-btn')

    expect(buttonsWithW[9].attributes('disabled')).toBeUndefined()

    const wrapperWithOther = mount(KanaFilter, {
      props: {
        availableRows: new Set(['other']),
      },
    })
    const buttonsWithOther = wrapperWithOther.findAll('button.kana-btn')

    expect(buttonsWithOther[9].attributes('disabled')).toBeUndefined()
  })
})
