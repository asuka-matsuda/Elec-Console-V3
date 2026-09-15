import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import MoleculesSiteExcelIntegration from '../../../app/components/portal/MoleculesSiteExcelIntegration.vue'

describe('MoleculesSiteExcelIntegration.vue', () => {
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
    const wrapper = mount(MoleculesSiteExcelIntegration, {
      props: baseProps,
    })

    expect(wrapper.text()).toContain('Excelデータ取込')
    expect(wrapper.text()).toContain('最新結果の帳票出力')
    expect(wrapper.text()).toContain('ファイルを選択して差分同期')
    expect(wrapper.text()).toContain('全件初期化取込')
    expect(wrapper.text()).toContain('Excel帳票ダウンロード')
  })

  it('renders sync result box when syncResultData is provided', () => {
    const wrapper = mount(MoleculesSiteExcelIntegration, {
      props: {
        ...baseProps,
        syncResultData: {
          title: '差分同期完了',
          type: 'merge',
          count: 10,
          createdCount: 2,
          updatedCount: 3,
        },
      },
    })

    expect(wrapper.text()).toContain('差分同期完了')
    expect(wrapper.text()).toContain('追加: +2 件')
    expect(wrapper.text()).toContain('変更: 3 件')
    expect(wrapper.text()).toContain('全回路数: 10 件')
  })
})
