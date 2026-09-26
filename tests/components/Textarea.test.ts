import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { computed } from 'vue'

import Textarea from '../../app/components/common/atoms/Textarea.vue'
import { FORM_GROUP_KEY } from '../../app/constants/injectionKeys'

describe('Textarea.vue', () => {
  it('renders textarea with default props', () => {
    const wrapper = mount(Textarea, {
      props: {
        modelValue: 'テストテキスト',
      },
    })

    const textarea = wrapper.find('textarea')

    expect(textarea.exists()).toBe(true)
    expect((textarea.element as HTMLTextAreaElement).value).toBe('テストテキスト')
    expect(textarea.attributes('rows')).toBe('4')
    expect(textarea.classes()).toContain('resize-y')
  })

  it('updates modelValue on input event', async () => {
    const wrapper = mount(Textarea, {
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
    const wrapper = mount(Textarea, {
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

  it('applies resize class based on resize prop', () => {
    const wrapper = mount(Textarea, {
      props: {
        resize: 'none',
      },
    })

    expect(wrapper.find('textarea').classes()).toContain('resize-none')
  })

  it('emits focus and blur events', async () => {
    const wrapper = mount(Textarea)
    const textarea = wrapper.find('textarea')

    await textarea.trigger('focus')
    expect(wrapper.emitted('focus')).toBeTruthy()

    await textarea.trigger('blur')
    expect(wrapper.emitted('blur')).toBeTruthy()
  })

  it('emits submit-shortcut on Ctrl+Enter', async () => {
    const wrapper = mount(Textarea)
    const textarea = wrapper.find('textarea')

    await textarea.trigger('keydown', { key: 'Enter', ctrlKey: true })
    expect(wrapper.emitted('submit-shortcut')).toBeTruthy()
  })

  it('syncs id and error state with injected formGroup', () => {
    const wrapper = mount(Textarea, {
      global: {
        provide: {
          [FORM_GROUP_KEY as symbol]: {
            id: computed(() => 'form-textarea-id'),
            hasError: computed(() => true),
          },
        },
      },
    })

    const textarea = wrapper.find('textarea')

    expect(textarea.attributes('id')).toBe('form-textarea-id')
    expect(textarea.classes()).toContain('is-error')
  })

  it('applies is-auto-resize class and resize-none when autoResize is true', () => {
    const wrapper = mount(Textarea, {
      props: {
        autoResize: true,
      },
    })

    const textarea = wrapper.find('textarea')

    expect(textarea.classes()).toContain('is-auto-resize')
    expect(textarea.classes()).toContain('resize-none')
  })

  it('exposes DOM focus, blur, and select methods', () => {
    const wrapper = mount(Textarea)

    expect(typeof wrapper.vm.focus).toBe('function')
    expect(typeof wrapper.vm.blur).toBe('function')
    expect(typeof wrapper.vm.select).toBe('function')
    expect(wrapper.vm.textareaRef).toBeDefined()
  })
})
