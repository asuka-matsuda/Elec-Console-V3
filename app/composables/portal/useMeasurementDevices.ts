/**
 * 現場測定機器管理 Composable
 *
 * @description 現場に登録された測定機器（メガ・電圧計・検相器）の取得、
 * 選択状態の管理、および台帳保存処理を提供します。
 */
import type { MaybeRefOrGetter } from 'vue'
import { computed, ref, toValue } from 'vue'

import type {
  MeasurementDevice,
  MeasurementDevicesApiResponse,
  SelectedMeasurementDevices,
} from '#shared/types/measurementDevice'
import { useApi } from '~/composables/useApi'
import type { SelectedDevicesMap } from '~/utils/examReportExcel'

export function useMeasurementDevices(siteIdSource: MaybeRefOrGetter<string>) {
  const { $api } = useApi()

  const siteId = computed(() => toValue(siteIdSource))
  const devices = ref<MeasurementDevice[]>([])
  const selectedMeggerId = ref<string>('')
  const selectedVoltmeterId = ref<string>('')
  const selectedPhaseDetectorId = ref<string>('')
  const isDevicesModalOpen = ref(false)
  const isLoadingDevices = ref(false)

  const buildDeviceOptions = (category: string) => [
    { value: '', label: '（指定なし / 未使用）' },
    ...devices.value
      .filter(d => d.category === category)
      .map(d => ({
        value: d.id,
        label: `${d.maker} ${d.model}${d.serialNumber ? ` (製番: ${d.serialNumber})` : ''}${d.note ? ` - ${d.note}` : ''}`,
      })),
  ]

  const meggerOptions = computed(() => buildDeviceOptions('megger'))
  const voltmeterOptions = computed(() => buildDeviceOptions('voltmeter'))
  const phaseDetectorOptions = computed(() => buildDeviceOptions('phaseDetector'))

  const currentSelectedDevices = computed<SelectedMeasurementDevices>(() => ({
    meggerId: selectedMeggerId.value || undefined,
    voltmeterId: selectedVoltmeterId.value || undefined,
    phaseDetectorId: selectedPhaseDetectorId.value || undefined,
  }))

  const selectedDevicesMap = computed<SelectedDevicesMap>(() => ({
    megger: devices.value.find(d => d.id === selectedMeggerId.value) || null,
    voltmeter: devices.value.find(d => d.id === selectedVoltmeterId.value) || null,
    phaseDetector: devices.value.find(d => d.id === selectedPhaseDetectorId.value) || null,
  }))

  // 測定機器データの取得
  const fetchMeasurementDevices = async () => {
    if (!siteId.value) return

    isLoadingDevices.value = true
    try {
      const res = await $api<MeasurementDevicesApiResponse>(
        `/api/sites/${siteId.value}/measurement-devices`,
      )

      devices.value = res.devices || []
      if (res.selectedDeviceIds) {
        selectedMeggerId.value = res.selectedDeviceIds.meggerId || ''
        selectedVoltmeterId.value = res.selectedDeviceIds.voltmeterId || ''
        selectedPhaseDetectorId.value = res.selectedDeviceIds.phaseDetectorId || ''
      }
    }
    catch (err) {
      console.error('Failed to fetch measurement devices:', err)
    }
    finally {
      isLoadingDevices.value = false
    }
  }

  // 測定機器選択の保存
  const saveSelectedDeviceIds = async () => {
    if (!siteId.value) return

    try {
      await $api(`/api/sites/${siteId.value}/measurement-devices`, {
        method: 'PUT',
        body: {
          devices: devices.value,
          selectedDeviceIds: currentSelectedDevices.value,
        },
      })
    }
    catch (err) {
      console.error('Failed to save selected devices:', err)
    }
  }

  const onDeviceSelectionChange = () => {
    saveSelectedDeviceIds()
  }

  const onDevicesUpdated = (updatedDevices: MeasurementDevice[]) => {
    devices.value = updatedDevices
    if (selectedMeggerId.value && !updatedDevices.some(d => d.id === selectedMeggerId.value)) {
      selectedMeggerId.value = ''
    }
    if (selectedVoltmeterId.value && !updatedDevices.some(d => d.id === selectedVoltmeterId.value)) {
      selectedVoltmeterId.value = ''
    }
    if (selectedPhaseDetectorId.value && !updatedDevices.some(d => d.id === selectedPhaseDetectorId.value)) {
      selectedPhaseDetectorId.value = ''
    }
    saveSelectedDeviceIds()
  }

  return {
    devices,
    selectedMeggerId,
    selectedVoltmeterId,
    selectedPhaseDetectorId,
    isDevicesModalOpen,
    isLoadingDevices,
    meggerOptions,
    voltmeterOptions,
    phaseDetectorOptions,
    currentSelectedDevices,
    selectedDevicesMap,
    fetchMeasurementDevices,
    saveSelectedDeviceIds,
    onDeviceSelectionChange,
    onDevicesUpdated,
  }
}
