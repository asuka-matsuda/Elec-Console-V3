import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import MoleculesSiteExcludedRules from '../../../app/components/portal/MoleculesSiteExcludedRules.vue'

describe('MoleculesSiteExcludedRules.vue', () => {
  it('renders excluded circuits and emits events', async () => {
    const wrapper = mount(MoleculesSiteExcludedRules, {
      props: {
        excludedCircuitsList: ['盤A-1', '盤B-2'],
      },
    })

    expect(wrapper.text()).toContain('除外回路の設定')

    const inputs = wrapper.findAllComponents({ name: 'Input' })

    expect(inputs).toHaveLength(2)

    const addBtn = wrapper.findAllComponents({ name: 'Button' }).find(b => b.text().includes('除外回路を追加する'))

    expect(addBtn).toBeDefined()

    await addBtn!.trigger('click')

    expect(wrapper.emitted('add-circuit')).toBeTruthy()
  })

  it('renders empty state when list is empty', () => {
    const wrapper = mount(MoleculesSiteExcludedRules, {
      props: {
        excludedCircuitsList: [],
      },
    })

    expect(wrapper.text()).toContain('除外回路は設定されていません')
  })
})
