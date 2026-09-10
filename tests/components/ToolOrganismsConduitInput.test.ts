import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { ref } from 'vue'

import OrganismsConduitInput from '../../app/components/tool/OrganismsConduitInput.vue'
import type { ConduitInputData } from '../../app/types/tools'

describe('ToolOrganismsConduitInput (app/components/tool/OrganismsConduitInput.vue)', () => {
  const createMockInputs = (overrides: Partial<ConduitInputData> = {}): ConduitInputData => ({
    conduitCategory: 'e',
    customFillRate: 80,
    inputCables: [
      { id: 'cable-1', category: 'IV', cableIdx: 'IV_1.6', count: 3 },
      { id: 'cable-2', category: 'IV', cableIdx: 'IV_2.0', count: 1 },
    ],
    ...overrides,
  })

  const mockCategoryOptions = [
    { label: 'ねじなし電線管 (E)', value: 'e' },
    { label: '厚鋼電線管 (G)', value: 'g' },
  ]

  const commonStubs = {
    MoleculesFormGroup: {
      props: ['label'],
      template: '<div class="form-group-stub"><label>{{ label }}</label><slot /></div>',
    },
    MoleculesInputGroup: {
      props: ['addon'],
      template: '<div class="input-group-stub"><slot /><span>{{ addon }}</span></div>',
    },
    AtomsInput: {
      props: ['modelValue', 'placeholder', 'type'],
      template: '<input :value="modelValue" class="atoms-input-stub" />',
    },
    AtomsIcon: {
      props: ['name'],
      template: '<span class="icon-stub">{{ name }}</span>',
    },
    AtomsButton: {
      props: ['disabled'],
      template: '<button :disabled="disabled"><slot /></button>',
    },
    AtomsSelect: {
      props: ['modelValue', 'options', 'disabled'],
      template: '<select class="atoms-select-stub"><slot /></select>',
    },
    MoleculesTable: {
      props: ['columns', 'data'],
      template: `
        <div class="molecules-table-stub">
          <div v-for="row in data" :key="row.id" class="table-row">
            <slot name="cell-category" :row="row" />
            <slot name="cell-cableIdx" :row="row" />
            <slot name="cell-count" :row="row" />
            <div class="cell-spec-val">{{ row.spec }}</div>
            <div class="cell-spec-detail">{{ row.specDetail }}</div>
            <slot name="cell-actions" :row="row" />
          </div>
        </div>
      `,
    },
  }

  it('初期描画が正常に行われること', () => {
    const inputs = ref(createMockInputs())
    const wrapper = mount(OrganismsConduitInput, {
      props: {
        'modelValue': inputs.value,
        'categoryOptions': mockCategoryOptions,
        'onUpdate:modelValue': (val: ConduitInputData) => {
          inputs.value = val
        },
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.text()).toContain('対象の配管種類')
    expect(wrapper.text()).toContain('占積率')
    expect(wrapper.text()).toContain('ケーブルを追加')
  })

  it('ケーブル追加ボタンをクリックすると add-cable が emit されること', async () => {
    const inputs = ref(createMockInputs())
    const wrapper = mount(OrganismsConduitInput, {
      props: {
        'modelValue': inputs.value,
        'categoryOptions': mockCategoryOptions,
        'onUpdate:modelValue': (val: ConduitInputData) => {
          inputs.value = val
        },
      },
      global: {
        stubs: commonStubs,
      },
    })

    const addButton = wrapper.findAll('button').find(b => b.text().includes('ケーブルを追加'))

    expect(addButton).toBeDefined()
    await addButton?.trigger('click')

    expect(wrapper.emitted('add-cable')).toBeTruthy()
    expect(wrapper.emitted('add-cable')?.length).toBe(1)
  })

  it('ケーブル削除ボタンをクリックすると remove-cable が emit されること', async () => {
    const inputs = ref(createMockInputs())
    const wrapper = mount(OrganismsConduitInput, {
      props: {
        'modelValue': inputs.value,
        'categoryOptions': mockCategoryOptions,
        'onUpdate:modelValue': (val: ConduitInputData) => {
          inputs.value = val
        },
      },
      global: {
        stubs: commonStubs,
      },
    })

    const deleteButtons = wrapper.findAll('button[aria-label="削除"]')

    expect(deleteButtons.length).toBe(2)
    await deleteButtons[0].trigger('click')

    expect(wrapper.emitted('remove-cable')).toBeTruthy()
    expect(wrapper.emitted('remove-cable')?.[0]).toEqual(['cable-1'])
  })

  it('ケーブル条数に応じて合計断面積と内訳（断面積×条数）が動的に計算・表示されること', () => {
    const inputs = ref(
      createMockInputs({
        inputCables: [
          { id: 'cable-single', category: 'IV', cableIdx: 'idx_0', count: 1 },
          { id: 'cable-multi', category: 'IV', cableIdx: 'idx_0', count: 3 },
        ],
      }),
    )
    const wrapper = mount(OrganismsConduitInput, {
      props: {
        'modelValue': inputs.value,
        'categoryOptions': mockCategoryOptions,
        'onUpdate:modelValue': (val: ConduitInputData) => {
          inputs.value = val
        },
      },
      global: {
        stubs: commonStubs,
      },
    })

    const rows = wrapper.findAll('.table-row')

    expect(rows.length).toBe(2)

    // 1行目 (count=1): 合計断面積のみ表示され、内訳は空
    const row1Spec = rows[0].find('.cell-spec-val').text()
    const row1Detail = rows[0].find('.cell-spec-detail').text()

    expect(row1Spec).toContain('mm²')
    expect(row1Detail).toBe('')

    // 2行目 (count=3): 3条分の合計断面積と (単体断面積×3) の内訳が表示されること
    const row2Spec = rows[1].find('.cell-spec-val').text()
    const row2Detail = rows[1].find('.cell-spec-detail').text()

    expect(row2Spec).toContain('mm²')
    expect(row2Detail).toContain('×3')
  })
})
