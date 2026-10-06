import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Toast from '../../app/components/common/molecules/Toast.vue'
import { useToast } from '../../app/composables/useToast'

describe('Toast (Geist準拠)', () => {
  beforeEach(() => {
    const { clear } = useToast()

    clear()
  })

  const commonStubs = {
    Icon: true,
    Button: {
      template: '<button type="button" class="btn"><slot /></button>',
    },
    TransitionGroup: {
      template: '<div><slot /></div>',
    },
  }

  it('renders nothing when there are no toasts', () => {
    const wrapper = mount(Toast, {
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.findAll('.toast-card')).toHaveLength(0)
  })

  it('renders toast cards with proper variants', async () => {
    const { success, error, warning, info, default: defaultToast } = useToast()

    const wrapper = mount(Toast, {
      global: {
        stubs: commonStubs,
      },
    })

    success('保存成功')
    error('削除失敗')
    warning('注意が必要です')
    info('情報通知')
    defaultToast('通常メッセージ')

    await wrapper.vm.$nextTick()

    const cards = wrapper.findAll('.toast-card')

    expect(cards).toHaveLength(5)
    expect(cards[0].classes()).toContain('is-success')
    expect(cards[0].text()).toContain('保存成功')
    expect(cards[1].classes()).toContain('is-danger')
    expect(cards[1].text()).toContain('削除失敗')
    expect(cards[2].classes()).toContain('is-warning')
    expect(cards[2].text()).toContain('注意が必要です')
    expect(cards[3].classes()).toContain('is-info')
    expect(cards[3].text()).toContain('情報通知')
    expect(cards[4].classes()).toContain('is-default')
    expect(cards[4].text()).toContain('通常メッセージ')
  })

  it('removes toast when close button is clicked', async () => {
    const { info } = useToast()

    const wrapper = mount(Toast, {
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

  it('renders action button and triggers callback when clicked', async () => {
    const toast = useToast()
    const handleUndo = vi.fn()

    const wrapper = mount(Toast, {
      global: {
        stubs: commonStubs,
      },
    })

    toast.success('プロジェクトを削除しました', {
      action: {
        label: '元に戻す',
        onClick: handleUndo,
      },
    })

    await wrapper.vm.$nextTick()

    const card = wrapper.find('.toast-card')

    expect(card.exists()).toBe(true)
    expect(card.text()).toContain('元に戻す')

    const actionBtn = wrapper.find('.btn')

    await actionBtn.trigger('click')
    await wrapper.vm.$nextTick()

    expect(handleUndo).toHaveBeenCalledTimes(1)
    // アクション実行後に自動でトーストが消去される
    expect(wrapper.findAll('.toast-card')).toHaveLength(0)
  })

  it('renders cancel button and triggers callback when clicked', async () => {
    const toast = useToast()
    const handleCancel = vi.fn()

    const wrapper = mount(Toast, {
      global: {
        stubs: commonStubs,
      },
    })

    toast.default('変更を適用しますか？', {
      cancel: {
        label: '破棄',
        onClick: handleCancel,
      },
    })

    await wrapper.vm.$nextTick()

    const card = wrapper.find('.toast-card')

    expect(card.exists()).toBe(true)
    expect(card.text()).toContain('破棄')

    const cancelBtn = wrapper.find('.btn')

    await cancelBtn.trigger('click')
    await wrapper.vm.$nextTick()

    expect(handleCancel).toHaveBeenCalledTimes(1)
    expect(wrapper.findAll('.toast-card')).toHaveLength(0)
  })

  it('does not have pure accessibility attributes (aria-*, role)', async () => {
    const { success } = useToast()

    const wrapper = mount(Toast, {
      global: {
        stubs: commonStubs,
      },
    })

    success('規約検証')
    await wrapper.vm.$nextTick()

    const card = wrapper.find('.toast-card')

    expect(card.attributes('role')).toBeUndefined()
    expect(card.attributes('aria-live')).toBeUndefined()
  })

  it('keeps toast when preserve option is true', async () => {
    const toast = useToast()

    const wrapper = mount(Toast, {
      global: {
        stubs: commonStubs,
      },
    })

    toast.warning('手動で閉じるまで保持', { preserve: true })
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('.toast-card')).toHaveLength(1)
    const toastItem = toast.toasts.value[0]

    expect(toastItem.preserve).toBe(true)
  })
})
