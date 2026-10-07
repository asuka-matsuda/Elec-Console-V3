import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'

import Collapse from '~/components/common/molecules/Collapse.vue'
import CollapseGroup from '~/components/common/molecules/CollapseGroup.vue'

describe('Collapse', () => {
  it('タイトルとサブタイトルが正しくレンダリングされること', () => {
    const wrapper = mount(Collapse, {
      props: {
        title: 'テストタイトル',
        subtitle: 'テストサブタイトル',
      },
      slots: {
        default: '折りたたみコンテンツ',
      },
    })

    expect(wrapper.text()).toContain('テストタイトル')
    expect(wrapper.text()).toContain('テストサブタイトル')
    expect(wrapper.text()).toContain('折りたたみコンテンツ')
  })

  it('デフォルトでは閉じており、クリックで開閉すること', async () => {
    const wrapper = mount(Collapse, {
      props: {
        title: 'クリックテスト',
      },
      slots: {
        default: '本文',
      },
    })

    expect(wrapper.classes()).not.toContain('is-open')

    const button = wrapper.find('button.collapse-header')

    await button.trigger('click')

    expect(wrapper.classes()).toContain('is-open')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    expect(wrapper.emitted('change')?.[0]).toEqual([true])

    await button.trigger('click')
    expect(wrapper.classes()).not.toContain('is-open')
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([false])
  })

  it('defaultOpen: true のとき初期状態で開いていること', () => {
    const wrapper = mount(Collapse, {
      props: {
        title: '初期展開テスト',
        defaultOpen: true,
      },
    })

    expect(wrapper.classes()).toContain('is-open')
  })

  it('v-model による外部からの開閉制御が機能すること', async () => {
    const wrapper = mount(Collapse, {
      props: {
        title: 'v-modelテスト',
        modelValue: false,
      },
    })

    expect(wrapper.classes()).not.toContain('is-open')

    await wrapper.setProps({ modelValue: true })
    expect(wrapper.classes()).toContain('is-open')
  })

  it('disabled: true のときはクリックしても開閉しないこと', async () => {
    const wrapper = mount(Collapse, {
      props: {
        title: '無効化テスト',
        disabled: true,
      },
    })

    expect(wrapper.classes()).toContain('is-disabled')

    const button = wrapper.find('button.collapse-header')

    await button.trigger('click')

    expect(wrapper.classes()).not.toContain('is-open')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('card: true および bordered: false のクラスが適用されること', () => {
    const wrapper = mount(Collapse, {
      props: {
        card: true,
        bordered: false,
      },
    })

    expect(wrapper.classes()).toContain('is-card')
    expect(wrapper.classes()).not.toContain('is-bordered')
  })

  it('カスタムスロット (#title, #subtitle, #extra) が描画されること', () => {
    const wrapper = mount(Collapse, {
      slots: {
        title: '<span class="custom-title">カスタムタイトル</span>',
        subtitle: '<span class="custom-subtitle">カスタムサブ</span>',
        extra: '<span class="custom-extra">追加情報</span>',
        default: 'スロット本文',
      },
    })

    expect(wrapper.find('.custom-title').text()).toBe('カスタムタイトル')
    expect(wrapper.find('.custom-subtitle').text()).toBe('カスタムサブ')
    expect(wrapper.find('.custom-extra').text()).toBe('追加情報')
  })
})

describe('CollapseGroup', () => {
  it('複数の Collapse を包括して個別開閉できること', async () => {
    const wrapper = mount(CollapseGroup, {
      slots: {
        default: () => [
          h(Collapse, { value: 'item1', title: '項目1' }, () => '本文1'),
          h(Collapse, { value: 'item2', title: '項目2' }, () => '本文2'),
        ],
      },
    })

    const buttons = wrapper.findAll('button.collapse-header')

    expect(buttons).toHaveLength(2)

    // 項目1をクリックして開く
    await buttons[0].trigger('click')
    expect(wrapper.findAll('.collapse-item')[0].classes()).toContain('is-open')
    expect(wrapper.findAll('.collapse-item')[1].classes()).not.toContain('is-open')

    // 項目2をクリックして開く（非排他なので両方開く）
    await buttons[1].trigger('click')
    expect(wrapper.findAll('.collapse-item')[0].classes()).toContain('is-open')
    expect(wrapper.findAll('.collapse-item')[1].classes()).toContain('is-open')
  })

  it('accordion: true のとき排他制御（1つを開くと他が閉じる）が機能すること', async () => {
    const wrapper = mount(CollapseGroup, {
      props: {
        accordion: true,
      },
      slots: {
        default: () => [
          h(Collapse, { value: 'item1', title: '項目1' }, () => '本文1'),
          h(Collapse, { value: 'item2', title: '項目2' }, () => '本文2'),
        ],
      },
    })

    const buttons = wrapper.findAll('button.collapse-header')

    // 項目1を開く
    await buttons[0].trigger('click')
    expect(wrapper.findAll('.collapse-item')[0].classes()).toContain('is-open')
    expect(wrapper.findAll('.collapse-item')[1].classes()).not.toContain('is-open')

    // 項目2を開くと、項目1が閉じて項目2が開く
    await buttons[1].trigger('click')
    expect(wrapper.findAll('.collapse-item')[0].classes()).not.toContain('is-open')
    expect(wrapper.findAll('.collapse-item')[1].classes()).toContain('is-open')

    // 項目2をもう一度クリックすると閉じる
    await buttons[1].trigger('click')
    expect(wrapper.findAll('.collapse-item')[1].classes()).not.toContain('is-open')
  })

  it('v-model による外部指定キーでの初期展開が機能すること', () => {
    const wrapper = mount(CollapseGroup, {
      props: {
        modelValue: 'item2',
        accordion: true,
      },
      slots: {
        default: () => [
          h(Collapse, { value: 'item1', title: '項目1' }, () => '本文1'),
          h(Collapse, { value: 'item2', title: '項目2' }, () => '本文2'),
        ],
      },
    })

    expect(wrapper.findAll('.collapse-item')[0].classes()).not.toContain('is-open')
    expect(wrapper.findAll('.collapse-item')[1].classes()).toContain('is-open')
  })
})
