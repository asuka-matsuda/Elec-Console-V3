import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import MoleculesHelpTip from '../../app/components/common/molecules/HelpTip.vue'

describe('MoleculesHelpTip.vue', () => {
  const commonStubs = {
    AtomsIcon: {
      props: ['name'],
      template: '<span class="atoms-icon-stub">{{ name }}</span>',
    },
  }

  it('初期状態ではヘルプチップパネルが非表示であること', () => {
    const wrapper = mount(MoleculesHelpTip, {
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
    const wrapper = mount(MoleculesHelpTip, {
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

  it('helpId を指定するとマスタから解説文・参考規格が自動解決されること', async () => {
    const wrapper = mount(MoleculesHelpTip, {
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
    expect(wrapper.text()).toContain('内線規程に基づき')
    expect(wrapper.text()).toContain('内線規程・JEAC 8001')
  })

  it('カスタムスロットが正しく描画されること', async () => {
    const wrapper = mount(MoleculesHelpTip, {
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
