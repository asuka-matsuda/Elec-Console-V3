import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ToolResultDetails from '../../../app/components/tool/ResultDetails.vue'
import type { ResultDetailItem } from '../../../app/types/components'

describe('ToolResultDetails (app/components/tool/ResultDetails.vue)', () => {
  it('renders detail items with label, value, unit, and note', () => {
    const items: ResultDetailItem[] = [
      { label: 'ケーブル重量', value: '120.5', unit: 'kg', note: '(概算)' },
      { label: '電線サイズ', value: '5.5' },
    ]

    const wrapper = mount(ToolResultDetails, {
      props: { items },
    })

    expect(wrapper.text()).toContain('ケーブル重量')
    expect(wrapper.text()).toContain('120.5')
    expect(wrapper.text()).toContain('kg')
    expect(wrapper.text()).toContain('(概算)')
    expect(wrapper.text()).toContain('電線サイズ')
    expect(wrapper.text()).toContain('5.5')
  })

  it('renders default slot content', () => {
    const wrapper = mount(ToolResultDetails, {
      slots: {
        default: '<p class="note-text">内線規程 3110-6</p>',
      },
    })

    expect(wrapper.find('.note-text').exists()).toBe(true)
    expect(wrapper.text()).toContain('内線規程 3110-6')
  })

  it('renders both items and slot content simultaneously', () => {
    const items: ResultDetailItem[] = [
      { label: 'テスト項目', value: '100' },
    ]

    const wrapper = mount(ToolResultDetails, {
      props: { items },
      slots: {
        default: '<span>補足説明</span>',
      },
    })

    expect(wrapper.text()).toContain('テスト項目')
    expect(wrapper.text()).toContain('100')
    expect(wrapper.text()).toContain('補足説明')
  })

  it('does not render root element when items is empty and no slot is provided', () => {
    const wrapper = mount(ToolResultDetails, {
      props: { items: [] },
    })

    expect(wrapper.find('.result-details').exists()).toBe(false)
  })

  it('does not render root element when items is undefined and no slot is provided', () => {
    const wrapper = mount(ToolResultDetails)

    expect(wrapper.find('.result-details').exists()).toBe(false)
  })
})
