import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import TabSiteExcelIntegration from '../../../app/components/portal/admin/TabSiteExcelIntegration.vue'
import type { Site } from '../../../app/types/admin'

const mockHandleFileSelect = vi.fn()
const mockHandleMergeSync = vi.fn()
const mockHandleResetImport = vi.fn()
const mockHandleDownloadExcel = vi.fn()
const mockSelectedFile = ref<File | null>(null)
const mockSyncResultData = ref<any>(null)
const mockIsSyncing = ref(false)
const mockSyncAction = ref<string | null>(null)
const mockShowSyncMsg = ref(false)
const mockSyncMsg = ref('')
const mockSyncMsgType = ref<'info' | 'success' | 'error'>('info')

vi.mock('~/composables/portal/useSiteExcelSync', () => ({
  useSiteExcelSync: () => ({
    selectedFile: mockSelectedFile,
    isSyncing: mockIsSyncing,
    syncAction: mockSyncAction,
    showSyncMsg: mockShowSyncMsg,
    syncMsg: mockSyncMsg,
    syncMsgType: mockSyncMsgType,
    syncResultData: mockSyncResultData,
    handleFileSelect: mockHandleFileSelect,
    handleMergeSync: mockHandleMergeSync,
    handleResetImport: mockHandleResetImport,
    handleDownloadExcel: mockHandleDownloadExcel,
  }),
}))

describe('PortalTabSiteExcelIntegration', () => {
  const dummySite: Site = {
    id: 'site-a',
    name: '新宿現場',
    status: 'in_progress',
    createdAt: '2026-09-01',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockSelectedFile.value = null
    mockSyncResultData.value = null
    mockIsSyncing.value = false
    mockSyncAction.value = null
    mockShowSyncMsg.value = false
    mockSyncMsg.value = ''
    mockSyncMsgType.value = 'info'
  })

  it('renders upload section and download section with site prop', () => {
    const wrapper = mount(TabSiteExcelIntegration, {
      props: {
        site: dummySite,
      },
    })

    expect(wrapper.text()).toContain('Excelデータ取込')
    expect(wrapper.text()).toContain('最新結果の帳票出力')
    expect(wrapper.text()).toContain('ファイルを選択して差分同期')
    expect(wrapper.text()).toContain('全件初期化取込')
    expect(wrapper.text()).toContain('Excel帳票ダウンロード')
  })

  it('renders sync result box when syncResultData is provided', () => {
    mockSyncResultData.value = {
      title: '差分同期完了',
      type: 'merge',
      count: 10,
      createdCount: 2,
      updatedCount: 3,
      message: '完了メッセージ',
    }

    const wrapper = mount(TabSiteExcelIntegration, {
      props: {
        site: dummySite,
      },
    })

    expect(wrapper.text()).toContain('差分同期完了')
    expect(wrapper.text()).toContain('追加: +2 件')
    expect(wrapper.text()).toContain('変更: 3 件')
    expect(wrapper.text()).toContain('全回路数: 10 件')
  })

  it('calls handleFileSelect when PortalExcelDropzone updates', async () => {
    const wrapper = mount(TabSiteExcelIntegration, {
      props: {
        site: dummySite,
      },
    })

    const dropzone = wrapper.findComponent({ name: 'PortalExcelDropzone' })
    const file = new File(['dummy'], 'sample.xlsx')

    await dropzone.vm.$emit('update:modelValue', file)

    expect(mockHandleFileSelect).toHaveBeenCalledWith(file)
  })

  it('calls handler methods when action buttons are clicked', async () => {
    const file = new File(['dummy'], 'sample.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

    mockSelectedFile.value = file

    const wrapper = mount(TabSiteExcelIntegration, {
      props: {
        site: dummySite,
      },
    })

    const buttons = wrapper.findAllComponents({ name: 'Button' })
    const mergeBtn = buttons.find(b => b.text().includes('選択ファイルから差分同期'))
    const resetBtn = buttons.find(b => b.text().includes('全件初期化取込'))
    const downloadBtn = buttons.find(b => b.text().includes('Excel帳票ダウンロード'))

    expect(mergeBtn?.exists()).toBe(true)
    expect(resetBtn?.exists()).toBe(true)
    expect(downloadBtn?.exists()).toBe(true)

    await mergeBtn!.trigger('click')
    expect(mockHandleMergeSync).toHaveBeenCalled()

    await resetBtn!.trigger('click')
    expect(mockHandleResetImport).toHaveBeenCalled()

    await downloadBtn!.trigger('click')
    expect(mockHandleDownloadExcel).toHaveBeenCalled()
  })
})
