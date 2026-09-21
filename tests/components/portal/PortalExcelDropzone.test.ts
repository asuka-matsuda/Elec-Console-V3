import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PortalExcelDropzone from '../../../app/components/portal/atoms/ExcelDropzone.vue'

describe('PortalExcelDropzone.vue', () => {
  it('renders placeholder text and upload icon when no file is selected', () => {
    const wrapper = mount(PortalExcelDropzone, {
      props: {
        modelValue: null,
      },
    })

    expect(wrapper.text()).toContain('クリックしてファイルを選択')
    expect(wrapper.text()).toContain('対応形式: .xlsx, .xlsm, .xls')
  })

  it('renders file name, formatted size, and clear button when file is provided', () => {
    const dummyFile = new File(['dummy content here'], 'sample_circuits.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const wrapper = mount(PortalExcelDropzone, {
      props: {
        modelValue: dummyFile,
      },
    })

    expect(wrapper.text()).toContain('sample_circuits.xlsx')
    expect(wrapper.text()).toContain('B')
    expect(wrapper.findComponent({ name: 'Button' }).exists()).toBe(true)
  })

  it('emits update:modelValue with null when clear button is clicked', async () => {
    const dummyFile = new File(['dummy content'], 'test.xlsx')

    const wrapper = mount(PortalExcelDropzone, {
      props: {
        modelValue: dummyFile,
      },
    })

    const clearBtn = wrapper.findComponent({ name: 'Button' })

    await clearBtn.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([null])
  })
})
