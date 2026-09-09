import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { ref } from 'vue'

import RackInput from '../../app/components/tool/RackInput.vue'
import type { RackInputs } from '../../app/utils/tools/rack/rackMapper'

describe('ToolRackInput (app/components/tool/RackInput.vue)', () => {
  const createMockInputs = (overrides: Partial<RackInputs> = {}): RackInputs => ({
    mode: 'strong',
    rackHeight: 100,
    otherWidth: null,
    marginRate: 1.2,
    cableSpacing: 10,
    sideMargin: 60,
    strongCablesUI: [
      { id: 'cable-1', category: 'CV', cableIdx: '0', count: 3 },
      { id: 'cable-2', category: 'CV', cableIdx: '1', count: 1 },
    ],
    weakCablesUI: [
      { id: 'cable-w1', category: 'LAN', cableIdx: '0', count: 5 },
    ],
    ...overrides,
  })

  const commonStubs = {
    AtomsRadioGroup: {
      props: ['modelValue', 'options'],
      template: '<div class="radio-group-stub">{{ modelValue }}</div>',
    },
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
            <slot name="cell-spec" :row="row" />
            <slot name="cell-actions" :row="row" />
          </div>
        </div>
      `,
    },
  }

  it('強電モードで正しく初期描画されること', () => {
    const inputs = ref(createMockInputs())
    const wrapper = mount(RackInput, {
      props: {
        'modelValue': inputs.value,
        'onUpdate:modelValue': (val: RackInputs) => {
          inputs.value = val
        },
      },
      global: {
        stubs: commonStubs,
      },
    })

    // 基本条件ラベル
    expect(wrapper.text()).toContain('ラック高さ (H)')
    expect(wrapper.text()).toContain('弱電必要幅')

    // パラメータラベル
    expect(wrapper.text()).toContain('余裕係数')
    expect(wrapper.text()).toContain('ケーブル間隔')
    expect(wrapper.text()).toContain('親桁クリアランス')

    // セクションタイトル
    expect(wrapper.text()).toContain('強電ケーブル条件')
    expect(wrapper.text()).toContain('強電ケーブルを追加')
  })

  it('ケーブル追加ボタンをクリックすると add-strong-cable が emit されること', async () => {
    const inputs = ref(createMockInputs({ mode: 'strong' }))
    const wrapper = mount(RackInput, {
      props: {
        'modelValue': inputs.value,
        'onUpdate:modelValue': (val: RackInputs) => {
          inputs.value = val
        },
      },
      global: {
        stubs: commonStubs,
      },
    })

    const addButton = wrapper.findAll('button').find(b => b.text().includes('強電ケーブルを追加'))

    expect(addButton).toBeDefined()
    await addButton?.trigger('click')

    expect(wrapper.emitted('add-strong-cable')).toBeTruthy()
    expect(wrapper.emitted('add-strong-cable')?.length).toBe(1)
  })

  it('弱電モード時、タイトルと追加ボタンが弱電用になり add-weak-cable が emit されること', async () => {
    const inputs = ref(createMockInputs({ mode: 'weak' }))
    const wrapper = mount(RackInput, {
      props: {
        'modelValue': inputs.value,
        'onUpdate:modelValue': (val: RackInputs) => {
          inputs.value = val
        },
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.text()).toContain('強電必要幅')
    expect(wrapper.text()).toContain('弱電ケーブル条件')
    expect(wrapper.text()).toContain('弱電ケーブルを追加')

    const addButton = wrapper.findAll('button').find(b => b.text().includes('弱電ケーブルを追加'))

    await addButton?.trigger('click')

    expect(wrapper.emitted('add-weak-cable')).toBeTruthy()
    expect(wrapper.emitted('add-weak-cable')?.length).toBe(1)
  })

  it('ケーブル削除ボタンをクリックすると remove-strong-cable が emit されること', async () => {
    const inputs = ref(createMockInputs({ mode: 'strong' }))
    const wrapper = mount(RackInput, {
      props: {
        'modelValue': inputs.value,
        'onUpdate:modelValue': (val: RackInputs) => {
          inputs.value = val
        },
      },
      global: {
        stubs: commonStubs,
      },
    })

    // テーブル内の最初の削除ボタンをクリック
    const deleteButtons = wrapper.findAll('button[aria-label="削除"]')

    expect(deleteButtons.length).toBe(2)
    await deleteButtons[0].trigger('click')

    expect(wrapper.emitted('remove-strong-cable')).toBeTruthy()
    expect(wrapper.emitted('remove-strong-cable')?.[0]).toEqual(['cable-1'])
  })

  it('ケーブルが1行のみの場合、削除ボタンが非活性（disabled）になること', () => {
    const inputs = ref(
      createMockInputs({
        mode: 'strong',
        strongCablesUI: [{ id: 'single-cable', category: 'CV', cableIdx: '0', count: 1 }],
      }),
    )
    const wrapper = mount(RackInput, {
      props: {
        'modelValue': inputs.value,
        'onUpdate:modelValue': (val: RackInputs) => {
          inputs.value = val
        },
      },
      global: {
        stubs: commonStubs,
      },
    })

    const deleteButton = wrapper.find('button[aria-label="削除"]')

    expect(deleteButton.attributes('disabled')).toBeDefined()
  })
})
