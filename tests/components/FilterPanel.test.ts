import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import FilterPanel from '../../app/components/common/organisms/FilterPanel.vue'

describe('FilterPanel.vue', () => {
  const commonStubs = {
    Panel: {
      template: '<div class="panel-stub"><slot /></div>',
    },
    SectionHeader: {
      props: ['title', 'tag', 'icon'],
      template: '<div class="section-header-stub">{{ title }}</div>',
    },
    Input: {
      props: ['modelValue', 'placeholder', 'clearable'],
      emits: ['update:modelValue'],
      template: '<input :value="modelValue" :placeholder="placeholder" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    },
    Checkbox: {
      props: ['modelValue', 'value'],
      emits: ['update:modelValue'],
      template: '<label class="checkbox-stub"><input type="checkbox" :checked="Array.isArray(modelValue) ? modelValue.includes(value) : false" @change="$emit(\'update:modelValue\', Array.isArray(modelValue) ? (modelValue.includes(value) ? modelValue.filter(v => v !== value) : [...modelValue, value]) : [value])" /><slot /></label>',
    },
  }

  it('renders default title and placeholder', () => {
    const wrapper = mount(FilterPanel, {
      global: { stubs: commonStubs },
    })

    expect(wrapper.text()).toContain('絞り込み・検索')
    const input = wrapper.find('input')

    expect(input.attributes('placeholder')).toBe('キーワードで検索...')
  })

  it('renders custom title and placeholder', () => {
    const wrapper = mount(FilterPanel, {
      props: {
        title: '用語検索',
        placeholder: '用語名を入力...',
      },
      global: { stubs: commonStubs },
    })

    expect(wrapper.text()).toContain('用語検索')
    const input = wrapper.find('input')

    expect(input.attributes('placeholder')).toBe('用語名を入力...')
  })

  it('updates searchQuery on input', async () => {
    const wrapper = mount(FilterPanel, {
      props: {
        searchQuery: '',
      },
      global: { stubs: commonStubs },
    })

    const input = wrapper.find('input')

    await input.setValue('CVT')

    expect(wrapper.emitted('update:searchQuery')?.[0]).toEqual(['CVT'])
  })

  it('renders category options and updates activeCats', async () => {
    const categories = [
      { label: '強電', value: 'high' },
      { label: '弱電', value: 'low' },
    ]

    const wrapper = mount(FilterPanel, {
      props: {
        categoryOptions: categories,
        activeCats: ['high'],
      },
      global: { stubs: commonStubs },
    })

    expect(wrapper.text()).toContain('強電')
    expect(wrapper.text()).toContain('弱電')

    const checkboxes = wrapper.findAll('input[type="checkbox"]')

    expect(checkboxes).toHaveLength(2)
    expect((checkboxes[0].element as HTMLInputElement).checked).toBe(true)
    expect((checkboxes[1].element as HTMLInputElement).checked).toBe(false)
  })

  it('renders default slot content', () => {
    const wrapper = mount(FilterPanel, {
      slots: {
        default: '<div class="extra-slot">追加フィルター</div>',
      },
      global: { stubs: commonStubs },
    })

    expect(wrapper.text()).toContain('追加フィルター')
  })
})
