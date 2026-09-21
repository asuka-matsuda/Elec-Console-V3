import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SiteExcludedRules from '../../../app/components/portal/molecules/SiteExcludedRules.vue'

describe('SiteExcludedRules.vue', () => {
  it('renders excluded circuits and emits update:modelValue on add, remove, and update', async () => {
    const wrapper = mount(SiteExcludedRules, {
      props: {
        modelValue: ['盤A-1', '盤B-2'],
      },
    })

    expect(wrapper.text()).toContain('除外回路の設定')

    const inputs = wrapper.findAllComponents({ name: 'Input' })

    expect(inputs).toHaveLength(2)

    // 1. 追加ボタン
    const addBtn = wrapper.findAllComponents({ name: 'Button' }).find(b => b.text().includes('除外回路を追加する'))

    expect(addBtn).toBeDefined()
    await addBtn!.trigger('click')

    const emitted = wrapper.emitted('update:modelValue')

    expect(emitted).toBeTruthy()
    expect(emitted![0]).toEqual([['盤A-1', '盤B-2', '']])

    // 2. 削除ボタン
    const deleteBtns = wrapper.findAllComponents({ name: 'Button' }).filter(b => b.props('icon') === 'trash-2')

    expect(deleteBtns).toHaveLength(2)
    await deleteBtns[0]!.trigger('click')
    expect(emitted![1]).toEqual([['盤B-2']])

    // 3. 入力変更
    await inputs[0]!.vm.$emit('update:modelValue', '盤A-1-改')
    expect(emitted![2]).toEqual([['盤A-1-改', '盤B-2']])
  })

  it('renders empty state when list is empty', () => {
    const wrapper = mount(SiteExcludedRules, {
      props: {
        modelValue: [],
      },
    })

    expect(wrapper.text()).toContain('除外回路は設定されていません')
  })
})
