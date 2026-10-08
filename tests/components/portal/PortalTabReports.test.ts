import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import TabExam from '../../../app/components/portal/reports/TabExam.vue'
import TabRemote from '../../../app/components/portal/reports/TabRemote.vue'
import TabTag from '../../../app/components/portal/reports/TabTag.vue'

vi.mock('~/composables/portal/useTagReportPrint', () => ({
  useTagReportPrint: () => ({
    filteredRows: ref([
      {
        banMeisho: '1L-1',
        banShubetsu: '電灯',
        keiToName: '電灯系',
        keiTo: '二次',
        kairoBangou: '1-1',
        kairoMeisho: '事務室照明',
        values: {},
      },
    ]),
    isLoadingData: ref(false),
    selectedKeiTo: ref('ALL'),
    keiToOptions: ref([{ value: 'ALL', label: 'すべて' }]),
    selectedBanShubetsu: ref('ALL'),
    banShubetsuOptions: ref([{ value: 'ALL', label: 'すべて' }]),
    selectedBan: ref('ALL'),
    banOptions: ref([{ value: 'ALL', label: 'すべて' }]),
    selectedKansen: ref('ALL'),
    kansenOptions: ref([{ value: 'ALL', label: 'すべて' }]),
    flowDirection: ref('z'),
    flowDirectionOptions: ref([{ value: 'z', label: 'Z順' }]),
    fetchSiteData: vi.fn(),
  }),
}))

vi.mock('~/composables/portal/useExamReportPrint', () => ({
  useExamReportPrint: () => ({
    circuits: ref([
      {
        id: 'c1',
        banMeisho: '1L-1',
        keiTo: '二次',
        kairoBangou: '1',
        p1ConfirmedAt: '2026-10-01',
      },
    ]),
    fetchCircuits: vi.fn(),
  }),
}))

vi.mock('~/composables/portal/useMeasurementDevices', () => ({
  useMeasurementDevices: () => ({
    selectedDevicesMap: ref({
      megger: { model: 'IR4052-11', serialNumber: 'SN-001' },
      voltmeter: null,
      phaseDetector: null,
    }),
    fetchMeasurementDevices: vi.fn(),
  }),
}))

vi.mock('~/composables/portal/useRemoteControlSetting', () => ({
  useRemoteControlSetting: () => ({
    remoteCircuits: ref([
      { id: 'rc-1', banMeisho: '1L-1', fukaAddress: '0-1', uniqueKey: '0-1', densoKeiTo: '1' },
    ]),
    config: ref({ assignments: {} }),
    banList: ref(['1L-1']),
    densoKeiToList: ref(['1']),
    fetchSiteRemoteData: vi.fn(),
  }),
}))

describe('Portal Reports Tab Components', () => {
  it('TabTag renders circuit filter and table correctly', () => {
    const wrapper = mount(TabTag, {
      props: {
        siteId: 'site-1',
        siteName: 'テスト現場',
        template: null,
      },
    })

    expect(wrapper.text()).toContain('系統:')
    expect(wrapper.text()).toContain('事務室照明')
  })

  it('TabExam renders exam range selector and measurement device card', () => {
    const wrapper = mount(TabExam, {
      props: {
        siteId: 'site-1',
        siteName: 'テスト現場',
        template: null,
        hasSiteSettingExcel: true,
      },
    })

    expect(wrapper.text()).toContain('出力範囲の指定')
    expect(wrapper.text()).toContain('IR4052-11')
    expect(wrapper.text()).toContain('Phase 1 確認済')
  })

  it('TabRemote renders export target radios and summary', () => {
    const wrapper = mount(TabRemote, {
      props: {
        siteId: 'site-1',
        siteName: 'テスト現場',
        template: null,
      },
    })

    expect(wrapper.text()).toContain('1. 出力種別の選択')
    expect(wrapper.text()).toContain('リモコン編成サマリー')
    expect(wrapper.text()).toContain('負荷アドレス')
  })
})
