import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'

import ToastContainer from '../../app/components/common/molecules/ToastContainer.vue'
import { useToast } from '../../app/composables/useToast'

describe('ToastContainer', () => {
  beforeEach(() => {
    const { clear } = useToast()

    clear()
  })

  const commonStubs = {
    Icon: true,
    TransitionGroup: {
      template: '<div><slot /></div>',
    },
  }

  it('renders nothing when there are no toasts', () => {
    const wrapper = mount(ToastContainer, {
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.findAll('.toast-card')).toHaveLength(0)
  })

  it('renders toast cards when items are added to useToast', async () => {
    const { success, error } = useToast()

    const wrapper = mount(ToastContainer, {
      global: {
        stubs: commonStubs,
      },
    })

    success('保存成功')
    error('削除失敗')

    await wrapper.vm.$nextTick()

    const cards = wrapper.findAll('.toast-card')

    expect(cards).toHaveLength(2)
    expect(cards[0].classes()).toContain('is-success')
    expect(cards[0].text()).toContain('保存成功')
    expect(cards[1].classes()).toContain('is-danger')
    expect(cards[1].text()).toContain('削除失敗')
  })

  it('removes toast when close button is clicked', async () => {
    const { info } = useToast()

    const wrapper = mount(ToastContainer, {
      global: {
        stubs: commonStubs,
      },
    })

    info('閉じるテスト')
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('.toast-card')).toHaveLength(1)

    const closeBtn = wrapper.find('.toast-close')

    await closeBtn.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('.toast-card')).toHaveLength(0)
  })
})
