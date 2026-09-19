import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Disclaimer from '../../../app/components/common/molecules/Disclaimer.vue'

describe('Disclaimer (app/components/common/molecules/Disclaimer.vue)', () => {
  const commonGlobal = {
    stubs: {
      Icon: {
        props: ['name', 'size'],
        template: '<i class="icon-stub" :data-name="name" :data-size="size" />',
      },
    },
  }

  it('renders nothing when text is not provided or empty', () => {
    const wrapper = mount(Disclaimer, {
      props: {},
      global: commonGlobal,
    })

    expect(wrapper.find('.disclaimer').exists()).toBe(false)
  })

  it('renders alert-triangle icon and text when text prop is provided', () => {
    const wrapper = mount(Disclaimer, {
      props: {
        text: '注意: これはテスト用のカスタム注記文言です。',
      },
      global: commonGlobal,
    })

    expect(wrapper.find('.disclaimer').exists()).toBe(true)
    expect(wrapper.classes()).toContain('items-start')

    const icon = wrapper.find('.icon-stub')

    expect(icon.exists()).toBe(true)
    expect(icon.attributes('data-name')).toBe('alert-triangle')
    expect(icon.classes()).toContain('shrink-0')

    const span = wrapper.find('span')

    expect(span.classes()).toContain('min-w-0')
    expect(span.classes()).toContain('break-words')
    expect(wrapper.text()).toContain('注意: これはテスト用のカスタム注記文言です。')
  })
})
