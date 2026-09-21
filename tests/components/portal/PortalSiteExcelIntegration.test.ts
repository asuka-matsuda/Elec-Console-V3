import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SiteExcelIntegration from '../../../app/components/portal/organisms/SiteExcelIntegration.vue'

describe('PortalSiteExcelIntegration', () => {
  const baseProps = {
    selectedFile: null,
    isSyncing: false,
    syncAction: null,
    showSyncMsg: false,
    syncMsg: '',
    syncMsgType: 'info' as const,
    syncResultData: null,
  }

  it('renders upload section and download section', () => {
    const wrapper = mount(SiteExcelIntegration, {
      props: baseProps,
    })

    expect(wrapper.text()).toContain('Excelデータ取込')
    expect(wrapper.text()).toContain('最新結果の帳票出力')
    expect(wrapper.text()).toContain('ファイルを選択して差分同期')
    expect(wrapper.text()).toContain('全件初期化取込')
    expect(wrapper.text()).toContain('Excel帳票ダウンロード')
  })

  it('renders sync result box when syncResultData is provided', () => {
    const wrapper = mount(SiteExcelIntegration, {
      props: {
        ...baseProps,
        syncResultData: {
          title: '差分同期完了',
          type: 'merge',
          count: 10,
          createdCount: 2,
          updatedCount: 3,
          message: '完了メッセージ',
        },
      },
    })

    expect(wrapper.text()).toContain('差分同期完了')
    expect(wrapper.text()).toContain('追加: +2 件')
    expect(wrapper.text()).toContain('変更: 3 件')
    expect(wrapper.text()).toContain('全回路数: 10 件')
  })

  it('emits file-select when PortalExcelDropzone updates', async () => {
    const wrapper = mount(SiteExcelIntegration, {
      props: baseProps,
    })

    const dropzone = wrapper.findComponent({ name: 'PortalExcelDropzone' })
    const file = new File(['dummy'], 'sample.xlsx')

    await dropzone.vm.$emit('update:modelValue', file)

    expect(wrapper.emitted('file-select')?.[0]).toEqual([file])
  })

  it('emits actions when buttons are clicked', async () => {
    const file = new File(['dummy'], 'sample.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const wrapper = mount(SiteExcelIntegration, {
      props: {
        ...baseProps,
        selectedFile: file,
      },
    })

    const buttons = wrapper.findAllComponents({ name: 'Button' })
    const mergeBtn = buttons.find(b => b.text().includes('差分同期'))
    const resetBtn = buttons.find(b => b.text().includes('全件初期化取込'))
    const downloadBtn = buttons.find(b => b.text().includes('Excel帳票ダウンロード'))

    expect(mergeBtn).toBeDefined()
    expect(resetBtn).toBeDefined()
    expect(downloadBtn).toBeDefined()

    await mergeBtn!.trigger('click')
    expect(wrapper.emitted('merge-sync')).toBeTruthy()

    await resetBtn!.trigger('click')
    expect(wrapper.emitted('reset-import')).toBeTruthy()

    await downloadBtn!.trigger('click')
    expect(wrapper.emitted('download-excel')).toBeTruthy()
  })
})
