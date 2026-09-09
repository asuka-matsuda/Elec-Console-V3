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
    expect(document.body.querySelector('[role="tooltip"]')).toBeNull()
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

    // 1回目のクリックで開く (Teleport先: document.body)
    await button.trigger('click')
    const tooltip = document.body.querySelector('[role="tooltip"]')

    expect(tooltip).not.toBeNull()
    expect(tooltip?.textContent).toContain('テスト解説文')

    // 2回目のクリックで閉じる
    await button.trigger('click')
    expect(document.body.querySelector('[role="tooltip"]')).toBeNull()
  })

  it('helpId を指定するとマスタから解説文・参考規格が自動解決されること', async () => {
    const wrapper = mount(MoleculesHelpTip, {
      props: {
        helpId: 'conduitFillRate',
      },
      global: {
        stubs: commonStubs,
      },
    })

    const button = wrapper.find('button')

    await button.trigger('click')

    const tooltip = document.body.querySelector('[role="tooltip"]')

    expect(tooltip).not.toBeNull()
    expect(tooltip?.textContent).toContain('電線管の内断面積に対する全ケーブル断面積の割合')
    expect(tooltip?.textContent).toContain('内線規程 3105-3')
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

    const customContent = document.body.querySelector('.custom-content')

    expect(customContent).not.toBeNull()
    expect(customContent?.textContent).toBe('カスタムスロットの中身')
  })
})
