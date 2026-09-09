import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { ref } from 'vue'

import WeightInput from '../../app/components/tool/WeightInput.vue'
import type { WeightCalcInputs } from '../../app/utils/tools/weight/weightCalcLogic'

describe('ToolWeightInput (app/components/tool/WeightInput.vue)', () => {
  const createMockInputs = (overrides: Partial<WeightCalcInputs> = {}): WeightCalcInputs => ({
    category: 'CV',
    cableIdx: '0',
    L_input: 100,
    K: 0.8,
    ...overrides,
  })

  const commonStubs = {
    MoleculesFormGroup: {
      props: ['label', 'required'],
      template: '<div class="form-group-stub"><label>{{ label }}</label><slot /></div>',
    },
    MoleculesInputGroup: {
      props: ['addon'],
      template: '<div class="input-group-stub"><slot /><span class="addon">{{ addon }}</span></div>',
    },
    AtomsInput: {
      props: ['modelValue', 'type', 'min', 'max', 'step'],
      emits: ['update:modelValue'],
      template: '<input :value="modelValue" class="atoms-input-stub" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    },
    AtomsSelect: {
      props: ['modelValue', 'options', 'placeholder', 'disabled'],
      emits: ['update:modelValue'],
      template: '<select :disabled="disabled" class="atoms-select-stub"><slot /></select>',
    },
  }

  it('renders correctly with pure Tailwind grid layout classes', () => {
    const inputs = ref(createMockInputs())
    const wrapper = mount(WeightInput, {
      props: {
        'modelValue': inputs.value,
        'onUpdate:modelValue': (val: WeightCalcInputs) => {
          inputs.value = val
        },
      },
      global: {
        stubs: commonStubs,
      },
    })

    const rootDiv = wrapper.find('div')

    expect(rootDiv.exists()).toBe(true)
    expect(rootDiv.classes()).toContain('grid')
    expect(rootDiv.classes()).toContain('grid-cols-1')
    expect(rootDiv.classes()).toContain('sm:grid-cols-2')
  })

  it('renders all required form groups', () => {
    const inputs = ref(createMockInputs())
    const wrapper = mount(WeightInput, {
      props: {
        modelValue: inputs.value,
      },
      global: {
        stubs: commonStubs,
      },
    })

    const text = wrapper.text()

    expect(text).toContain('ケーブル種別')
    expect(text).toContain('ケーブルサイズ')
    expect(text).toContain('ケーブル長 (L)')
    expect(text).toContain('ドラム占積率 (K)')
  })

  it('disables cable size select when category is empty', () => {
    const inputs = ref(createMockInputs({ category: '', cableIdx: '' }))
    const wrapper = mount(WeightInput, {
      props: {
        modelValue: inputs.value,
      },
      global: {
        stubs: commonStubs,
      },
    })

    const selects = wrapper.findAllComponents(commonStubs.AtomsSelect)

    // 2番目のSelectがケーブルサイズ
    expect(selects[1].props('disabled')).toBe(true)
  })

  it('enables cable size select when category is provided', () => {
    const inputs = ref(createMockInputs({ category: 'CV', cableIdx: '0' }))
    const wrapper = mount(WeightInput, {
      props: {
        modelValue: inputs.value,
      },
      global: {
        stubs: commonStubs,
      },
    })

    const selects = wrapper.findAllComponents(commonStubs.AtomsSelect)

    expect(selects[1].props('disabled')).toBe(false)
  })

  it('resets cableIdx when category changes', async () => {
    const inputs = ref(createMockInputs({ category: 'CV', cableIdx: '0' }))

    mount(WeightInput, {
      props: {
        'modelValue': inputs.value,
        'onUpdate:modelValue': (val: WeightCalcInputs) => {
          inputs.value = val
        },
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(inputs.value.cableIdx).toBe('0')

    // カテゴリを変更
    inputs.value.category = 'CVT'
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(inputs.value.cableIdx).toBe('')
  })
})
