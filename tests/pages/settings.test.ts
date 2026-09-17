import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { STORAGE_KEYS } from '../../app/constants/storageKeys'
import SettingsPage from '../../app/pages/settings.vue'

vi.mock('#app/composables/head', () => ({
  useHead: vi.fn(),
  injectHead: vi.fn(),
}))

describe('pages/settings.vue', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders settings page headers and configuration panels', () => {
    const wrapper = mount(SettingsPage, {
      global: {
        stubs: {
          MoleculesSectionHeader: {
            template: '<div class="stub-header">{{ title }}</div>',
            props: ['title'],
          },
          Panel: {
            template: '<div class="stub-panel"><slot /></div>',
          },
          MoleculesFormGroup: {
            template: '<div class="stub-form-group"><slot /></div>',
          },
          AtomsSelect: {
            template: '<select class="stub-select" />',
            props: ['modelValue', 'options'],
          },
          Checkbox: {
            template: '<label class="stub-checkbox"><input type="checkbox" class="stub-checkbox-input" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />{{ label }}</label>',
            props: ['modelValue', 'label'],
          },
        },
      },
    })

    expect(wrapper.text()).toContain('UI・個人設定')
    expect(wrapper.text()).toContain('テーマ・カラー設定')
    expect(wrapper.text()).toContain('演出・アニメーション設定')
    expect(wrapper.find('.stub-select').exists()).toBe(true)
    expect(wrapper.find('.stub-checkbox').exists()).toBe(true)
  })

  it('toggles animationEnabled state and persists in localStorage', async () => {
    const wrapper = mount(SettingsPage, {
      global: {
        stubs: {
          MoleculesSectionHeader: true,
          Panel: {
            template: '<div><slot /></div>',
          },
          MoleculesFormGroup: {
            template: '<div><slot /></div>',
          },
          AtomsSelect: true,
          Checkbox: {
            template: '<input type="checkbox" class="stub-checkbox-input" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
            props: ['modelValue'],
          },
        },
      },
    })

    const checkbox = wrapper.find<HTMLInputElement>('.stub-checkbox-input')

    expect(checkbox.element.checked).toBe(true)

    // チェックを外す
    checkbox.element.checked = false
    await checkbox.trigger('change')
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(localStorage.getItem(STORAGE_KEYS.ANIMATION_ENABLED)).toBe('false')
  })
})
