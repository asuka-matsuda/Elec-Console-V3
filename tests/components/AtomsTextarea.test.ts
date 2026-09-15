import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AtomsTextarea from '../../app/components/AtomsTextarea.vue'

describe('AtomsTextarea', () => {
  it('renders textarea with default props', () => {
    const wrapper = mount(AtomsTextarea, {
      props: {
        modelValue: 'テストテキスト',
      },
    })

    const textarea = wrapper.find('textarea')

    expect(textarea.exists()).toBe(true)
    expect((textarea.element as HTMLTextAreaElement).value).toBe('テストテキスト')
    expect(textarea.attributes('rows')).toBe('4')
  })

  it('updates modelValue on input event', async () => {
    const wrapper = mount(AtomsTextarea, {
      props: {
        'modelValue': '',
        'onUpdate:modelValue': (val: string | null) => wrapper.setProps({ modelValue: val }),
      },
    })

    const textarea = wrapper.find('textarea')

    await textarea.setValue('新しいテキスト')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['新しいテキスト'])
  })

  it('applies custom rows, placeholder, disabled, and error class', () => {
    const wrapper = mount(AtomsTextarea, {
      props: {
        modelValue: '',
        rows: 6,
        placeholder: '特記事項を入力...',
        disabled: true,
        error: true,
      },
    })

    const textarea = wrapper.find('textarea')

    expect(textarea.attributes('rows')).toBe('6')
    expect(textarea.attributes('placeholder')).toBe('特記事項を入力...')
    expect(textarea.attributes('disabled')).toBeDefined()
    expect(textarea.classes()).toContain('is-error')
  })
})
