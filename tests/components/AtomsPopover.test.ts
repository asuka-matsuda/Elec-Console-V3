import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AtomsPopover from '../../app/components/common/atoms/Popover.vue'

describe('AtomsPopover.vue', () => {
  const commonStubs = {
    AtomsIcon: {
      props: ['name'],
      template: '<span class="atoms-icon-stub">{{ name }}</span>',
    },
  }

  it('初期状態ではポップオーバーパネルが非表示であること', () => {
    const wrapper = mount(AtomsPopover, {
      props: {
        text: 'テスト解説文',
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)
  })

  it('クリックで開閉トグルすること', async () => {
    const wrapper = mount(AtomsPopover, {
      props: {
        text: 'テスト解説文',
      },
      global: {
        stubs: commonStubs,
      },
    })

    const button = wrapper.find('button')

    // 1回目のクリックで開く
    await button.trigger('click')
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('テスト解説文')

    // 2回目のクリックで閉じる
    await button.trigger('click')
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)
  })

  it('helpId を指定するとマスタからタイトル・本文・参考規格が自動解決されること', async () => {
    const wrapper = mount(AtomsPopover, {
      props: {
        helpId: 'marginRate',
      },
      global: {
        stubs: commonStubs,
      },
    })

    const button = wrapper.find('button')
    await button.trigger('click')

    expect(wrapper.find('[role="tooltip"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('余裕係数')
    expect(wrapper.text()).toContain('内線規程に基づき')
    expect(wrapper.text()).toContain('内線規程・JEAC 8001')
  })

  it('title を直接指定した場合、タイトルが表示されること', async () => {
    const wrapper = mount(AtomsPopover, {
      props: {
        title: 'カスタムタイトル',
        text: 'カスタム本文',
      },
      global: {
        stubs: commonStubs,
      },
    })

    await wrapper.find('button').trigger('click')

    expect(wrapper.text()).toContain('カスタムタイトル')
    expect(wrapper.text()).toContain('カスタム本文')
  })

  it('カスタムスロットが正しく描画されること', async () => {
    const wrapper = mount(AtomsPopover, {
      slots: {
        default: '<div class="custom-content">カスタムスロットの中身</div>',
      },
      global: {
        stubs: commonStubs,
      },
    })

    await wrapper.find('button').trigger('click')

    expect(wrapper.find('.custom-content').exists()).toBe(true)
    expect(wrapper.find('.custom-content').text()).toBe('カスタムスロットの中身')
  })
})
