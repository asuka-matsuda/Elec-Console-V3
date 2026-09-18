import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, inject } from 'vue'

import FormGroup from '../../app/components/common/molecules/FormGroup.vue'
import { FORM_GROUP_KEY } from '../../app/types/components'

// FORM_GROUP_KEY の provide を検証するためのテスト用子コンポーネント
const ChildConsumer = defineComponent({
  setup() {
    const formGroup = inject(FORM_GROUP_KEY, null)

    return { formGroup }
  },
  template: '<div class="child-consumer" :data-id="formGroup?.id.value" :data-error="formGroup?.hasError.value"></div>',
})

describe('FormGroup.vue', () => {
  it('renders label text and connects label for-attribute to id', () => {
    const wrapper = mount(FormGroup, {
      props: {
        id: 'test-field-id',
        label: 'ユーザー名',
      },
    })

    const label = wrapper.find('label.label')

    expect(label.exists()).toBe(true)
    expect(label.text()).toContain('ユーザー名')
    expect(label.attributes('for')).toBe('test-field-id')
  })

  it('generates a default id when id prop is omitted', () => {
    const wrapper = mount(FormGroup, {
      props: {
        label: 'メールアドレス',
      },
    })

    const label = wrapper.find('label.label')

    expect(label.exists()).toBe(true)
    expect(label.attributes('for')).toBeTruthy()
  })

  it('does not render label when label prop and slot are omitted', () => {
    const wrapper = mount(FormGroup)

    expect(wrapper.find('label').exists()).toBe(false)
  })

  it('renders label slot instead of label prop when provided', () => {
    const wrapper = mount(FormGroup, {
      slots: {
        label: '<span class="custom-label">カスタム項目名</span>',
      },
    })

    expect(wrapper.find('.custom-label').exists()).toBe(true)
    expect(wrapper.find('.custom-label').text()).toBe('カスタム項目名')
  })

  it('renders required mark (＊) when required=true', () => {
    const wrapper = mount(FormGroup, {
      props: {
        label: 'パスワード',
        required: true,
      },
    })

    const mark = wrapper.find('.req-mark')

    expect(mark.exists()).toBe(true)
    expect(mark.text()).toBe('＊')
  })

  it('renders HelpTip when helpId is provided', () => {
    const wrapper = mount(FormGroup, {
      props: {
        label: '余裕係数',
        helpId: 'marginRate',
      },
    })

    const helpTip = wrapper.findComponent({ name: 'HelpTip' })

    expect(helpTip.exists()).toBe(true)
  })

  it('renders default slot content', () => {
    const wrapper = mount(FormGroup, {
      slots: {
        default: '<input class="test-input" type="text" />',
      },
    })

    expect(wrapper.find('input.test-input').exists()).toBe(true)
  })

  it('renders error message and applies is-error class', () => {
    const wrapper = mount(FormGroup, {
      props: {
        error: '入力値が不正です',
      },
    })

    expect(wrapper.classes()).toContain('is-error')
    const errorP = wrapper.find('p.error')

    expect(errorP.exists()).toBe(true)
    expect(errorP.text()).toBe('入力値が不正です')
  })

  it('renders help message when help is provided', () => {
    const wrapper = mount(FormGroup, {
      props: {
        help: '半角英数字で入力してください',
      },
    })

    const helpP = wrapper.find('p.help')

    expect(helpP.exists()).toBe(true)
    expect(helpP.text()).toBe('半角英数字で入力してください')
  })

  it('provides FORM_GROUP_KEY with fieldId and hasError to child components', () => {
    const wrapper = mount(FormGroup, {
      props: {
        id: 'consumer-test-id',
        error: 'エラーあり',
      },
      slots: {
        default: ChildConsumer,
      },
    })

    const consumer = wrapper.find('.child-consumer')

    expect(consumer.attributes('data-id')).toBe('consumer-test-id')
    expect(consumer.attributes('data-error')).toBe('true')
  })
})
