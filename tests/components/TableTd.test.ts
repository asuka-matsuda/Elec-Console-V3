import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import TableTd from '../../app/components/common/atoms/TableTd.vue'
import { WORD_JOINER } from '../../app/composables/useNoBreakWords'

describe('TableTd.vue', () => {
  it('通常セルで値が正しく描画され、省略スタイルおよび改行禁止処理が適用されること', () => {
    const wrapper = mount(TableTd, {
      props: {
        value: '分電盤-1',
      },
    })

    expect(wrapper.element.tagName).toBe('TD')
    // 自動改行禁止（分⁠電⁠盤）が適用されていることを検証
    expect(wrapper.text()).toContain(`分${WORD_JOINER}電${WORD_JOINER}盤`)
    expect(wrapper.classes()).toContain('is-truncate')
  })

  it('空値（null/undefined/空文字）の場合にフォールバック文字が表示されること', () => {
    const wrapperNull = mount(TableTd, { props: { value: null } })

    expect(wrapperNull.text()).toBe('-')

    const wrapperUndefined = mount(TableTd, { props: { value: undefined } })

    expect(wrapperUndefined.text()).toBe('-')

    const wrapperEmpty = mount(TableTd, {
      props: { value: '', emptyFallback: 'N/A' },
    })

    expect(wrapperEmpty.text()).toBe('N/A')
  })

  it('0 や false などの falsy な有効値が正しく描画されること', () => {
    const wrapperZero = mount(TableTd, { props: { value: 0 } })

    expect(wrapperZero.text()).toBe('0')

    const wrapperFalse = mount(TableTd, { props: { value: false } })

    expect(wrapperFalse.text()).toBe('false')
  })

  it('2段組（subValue指定時）に上下構造と配置クラスが正しく適用されること', () => {
    const wrapper = mount(TableTd, {
      props: {
        value: '主回路',
        subValue: '100V / 20A',
        align: 'right',
      },
    })

    expect(wrapper.classes()).not.toContain('is-truncate')
    const stacked = wrapper.find('.stacked-cell')

    expect(stacked.exists()).toBe(true)
    expect(stacked.classes()).toContain('items-end')
    expect(wrapper.find('.main-text').text()).toBe('主回路')
    expect(wrapper.find('.sub-text').text()).toBe('100V / 20A')
  })

  it('align プロパティがクラスに反映されること', () => {
    const wrapper = mount(TableTd, {
      props: {
        align: 'center',
        value: '123',
      },
    })

    expect(wrapper.classes()).toContain('text-center')
  })

  it('デフォルトスロットが指定された場合、スロット内容が優先描画されること', () => {
    const wrapper = mount(TableTd, {
      props: { value: '通常値' },
      slots: {
        default: '<span class="custom-badge">カスタム値</span>',
      },
    })

    expect(wrapper.find('.custom-badge').exists()).toBe(true)
    expect(wrapper.find('.custom-badge').text()).toBe('カスタム値')
  })

  it('省略表示セルで title 属性が自動設定され、明示的 title が優先されること', () => {
    const wrapperAuto = mount(TableTd, {
      props: { value: '長いテキスト' },
    })

    expect(wrapperAuto.attributes('title')).toBe('長いテキスト')

    const wrapperCustom = mount(TableTd, {
      props: { value: '長いテキスト', title: 'カスタムツールチップ' },
    })

    expect(wrapperCustom.attributes('title')).toBe('カスタムツールチップ')
  })

  it('値が空の場合に is-empty クラスが付与されること', () => {
    const wrapperEmpty = mount(TableTd, {
      props: { value: null },
    })

    expect(wrapperEmpty.classes()).toContain('is-empty')

    const wrapperVal = mount(TableTd, {
      props: { value: '値あり' },
    })

    expect(wrapperVal.classes()).not.toContain('is-empty')
  })

  it('truncate: false が指定された場合、通常セルでも is-truncate が外れること', () => {
    const wrapper = mount(TableTd, {
      props: {
        truncate: false,
        value: '複数行テキスト',
      },
    })

    expect(wrapper.classes()).not.toContain('is-truncate')
  })
})
