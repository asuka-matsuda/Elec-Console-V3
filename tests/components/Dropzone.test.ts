import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Dropzone from '../../app/components/common/molecules/Dropzone.vue'

describe('Dropzone.vue', () => {
  it('renders default placeholder text and upload icon when no file is selected', () => {
    const wrapper = mount(Dropzone, {
      props: {
        modelValue: null,
      },
    })

    expect(wrapper.text()).toContain('クリックしてファイルを選択')
    expect(wrapper.text()).toContain('またはここにドラッグ＆ドロップ')
  })

  it('renders custom label, subLabel, and hint from accept prop', () => {
    const wrapper = mount(Dropzone, {
      props: {
        modelValue: null,
        label: 'ファイルをアップロード',
        subLabel: '（Excel限定）',
        accept: '.xlsx, .xlsm',
      },
    })

    expect(wrapper.text()).toContain('ファイルをアップロード')
    expect(wrapper.text()).toContain('（Excel限定）')
    expect(wrapper.text()).toContain('対応形式: .xlsx, .xlsm')
  })

  it('renders file name, formatted size, and clear button when file is provided', () => {
    const dummyFile = new File(['dummy content here'], 'sample_circuits.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const wrapper = mount(Dropzone, {
      props: {
        modelValue: dummyFile,
      },
    })

    expect(wrapper.text()).toContain('sample_circuits.xlsx')
    expect(wrapper.text()).toContain('B')
    expect(wrapper.findComponent({ name: 'Button' }).exists()).toBe(true)
  })

  it('emits update:modelValue and change with null when clear button is clicked', async () => {
    const dummyFile = new File(['dummy content'], 'test.xlsx')

    const wrapper = mount(Dropzone, {
      props: {
        modelValue: dummyFile,
      },
    })

    const clearBtn = wrapper.findComponent({ name: 'Button' })

    await clearBtn.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([null])
    expect(wrapper.emitted('change')).toBeTruthy()
    expect(wrapper.emitted('change')?.[0]).toEqual([null])
  })

  it('hides clear button when clearable is false', () => {
    const dummyFile = new File(['dummy content'], 'test.xlsx')

    const wrapper = mount(Dropzone, {
      props: {
        modelValue: dummyFile,
        clearable: false,
      },
    })

    expect(wrapper.findComponent({ name: 'Button' }).exists()).toBe(false)
  })
})
