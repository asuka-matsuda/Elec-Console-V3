import { describe, expect, it, vi } from 'vitest'

import { useMeasurementDevices } from '../../app/composables/portal/useMeasurementDevices'
import type { MeasurementDevice } from '../../app/types/measurementDevice'

vi.mock('../../app/composables/useApi', () => ({
  useApi: () => ({
    $api: vi.fn(),
  }),
}))

describe('useMeasurementDevices', () => {
  const sampleDevices: MeasurementDevice[] = [
    {
      id: 'dev-1',
      siteId: 'site-1',
      category: 'megger',
      maker: '日置電機',
      model: 'IR4052-11',
      serialNumber: 'SN12345',
    },
    {
      id: 'dev-2',
      siteId: 'site-1',
      category: 'voltmeter',
      maker: '共立電気',
      model: 'KEW 2046R',
    },
    {
      id: 'dev-3',
      siteId: 'site-1',
      category: 'phaseDetector',
      maker: '日置電機',
      model: 'PD3129-10',
    },
  ]

  it('computes options by category correctly', () => {
    const {
      devices,
      meggerOptions,
      voltmeterOptions,
      phaseDetectorOptions,
    } = useMeasurementDevices('site-1')

    devices.value = sampleDevices

    expect(meggerOptions.value).toHaveLength(2) // 1 default + 1 item
    expect(meggerOptions.value[1].value).toBe('dev-1')
    expect(meggerOptions.value[1].label).toContain('IR4052-11')

    expect(voltmeterOptions.value).toHaveLength(2)
    expect(voltmeterOptions.value[1].value).toBe('dev-2')

    expect(phaseDetectorOptions.value).toHaveLength(2)
    expect(phaseDetectorOptions.value[1].value).toBe('dev-3')
  })

  it('computes selectedDevicesMap correctly', () => {
    const {
      devices,
      selectedMeggerId,
      selectedVoltmeterId,
      selectedPhaseDetectorId,
      selectedDevicesMap,
    } = useMeasurementDevices('site-1')

    devices.value = sampleDevices
    selectedMeggerId.value = 'dev-1'
    selectedVoltmeterId.value = 'dev-2'
    selectedPhaseDetectorId.value = ''

    expect(selectedDevicesMap.value.megger?.id).toBe('dev-1')
    expect(selectedDevicesMap.value.voltmeter?.id).toBe('dev-2')
    expect(selectedDevicesMap.value.phaseDetector).toBeNull()
  })

  it('clears invalid selected device id when updated', () => {
    const {
      devices,
      selectedMeggerId,
      onDevicesUpdated,
    } = useMeasurementDevices('site-1')

    devices.value = sampleDevices
    selectedMeggerId.value = 'dev-1'

    // Update with list omitting dev-1
    onDevicesUpdated([sampleDevices[1], sampleDevices[2]])

    expect(selectedMeggerId.value).toBe('')
  })
})
