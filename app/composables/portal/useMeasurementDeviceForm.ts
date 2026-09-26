/**
 * 測定機器台帳モーダル フォームオーケストレーション Composable
 *
 * @description 測定機器の追加・編集・削除フォーム状態、バリデーション、およびAPI永続化処理を管理します。
 */

import { computed, ref, watch } from 'vue'

import type {
  MeasurementDevice,
  MeasurementDeviceCategory,
  SelectedMeasurementDevices,
} from '#shared/types/measurementDevice'
import { useApi } from '~/composables/useApi'
import { parseToAppException } from '~/utils/errors'

export interface UseMeasurementDeviceFormOptions {
  siteId: string
  devices: () => MeasurementDevice[]
  selectedDeviceIds?: () => SelectedMeasurementDevices | undefined
  isOpen: () => boolean
  onUpdated: (devices: MeasurementDevice[]) => void
}

export function useMeasurementDeviceForm(options: UseMeasurementDeviceFormOptions) {
  const { siteId, devices, selectedDeviceIds, isOpen, onUpdated } = options
  const { $api } = useApi()

  const localDevices = ref<MeasurementDevice[]>([])
  const isSaving = ref(false)
  const errorMessage = ref<string | null>(null)
  const editingId = ref<string | null>(null)

  // フォームの入力状態
  const formCategory = ref<MeasurementDeviceCategory>('megger')
  const formMaker = ref('')
  const formModel = ref('')
  const formCalibrationDate = ref('')
  const formSerialNumber = ref('')
  const formNote = ref('')

  // devices の変更を同期
  watch(
    devices,
    (val) => {
      localDevices.value = JSON.parse(JSON.stringify(val || []))
    },
    { immediate: true, deep: true },
  )

  const resetForm = () => {
    editingId.value = null
    formCategory.value = 'megger'
    formMaker.value = ''
    formModel.value = ''
    formCalibrationDate.value = ''
    formSerialNumber.value = ''
    formNote.value = ''
    errorMessage.value = null
  }

  // モーダル開閉時のリセット
  watch(
    isOpen,
    (open) => {
      if (open) {
        resetForm()
        localDevices.value = JSON.parse(JSON.stringify(devices() || []))
      }
    },
  )

  const handleEditItem = (item: MeasurementDevice) => {
    editingId.value = item.id
    formCategory.value = item.category
    formMaker.value = item.maker
    formModel.value = item.model
    formCalibrationDate.value = item.calibrationDate || ''
    formSerialNumber.value = item.serialNumber || ''
    formNote.value = item.note || ''
    errorMessage.value = null
  }

  const handleCancelEdit = () => {
    resetForm()
  }

  const persistDevices = async (list: MeasurementDevice[]) => {
    isSaving.value = true
    errorMessage.value = null

    try {
      const res = await $api<{ devices: MeasurementDevice[] }>(
        `/api/sites/${siteId}/measurement-devices`,
        {
          method: 'PUT',
          body: {
            devices: list,
            selectedDeviceIds: selectedDeviceIds?.(),
          },
        },
      )

      localDevices.value = res.devices || list
      onUpdated(localDevices.value)
    }
    catch (err: unknown) {
      const appErr = parseToAppException(err)

      errorMessage.value = appErr.getUserFacingMessage()
    }
    finally {
      isSaving.value = false
    }
  }

  const handleSaveItem = async () => {
    if (!formMaker.value.trim() || !formModel.value.trim()) return

    const now = new Date().toISOString()
    let updatedList: MeasurementDevice[]

    if (editingId.value) {
      updatedList = localDevices.value.map((d) => {
        if (d.id === editingId.value) {
          return {
            ...d,
            category: formCategory.value,
            maker: formMaker.value.trim(),
            model: formModel.value.trim(),
            calibrationDate: formCalibrationDate.value.trim(),
            serialNumber: formSerialNumber.value.trim(),
            note: formNote.value.trim() || undefined,
            updatedAt: now,
          }
        }

        return d
      })
    }
    else {
      const newDevice: MeasurementDevice = {
        id: `dev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        category: formCategory.value,
        maker: formMaker.value.trim(),
        model: formModel.value.trim(),
        calibrationDate: formCalibrationDate.value.trim(),
        serialNumber: formSerialNumber.value.trim(),
        note: formNote.value.trim() || undefined,
      }

      updatedList = [...localDevices.value, newDevice]
    }

    await persistDevices(updatedList)
    if (!errorMessage.value) {
      resetForm()
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (editingId.value === id) {
      resetForm()
    }

    const updatedList = localDevices.value.filter(d => d.id !== id)

    await persistDevices(updatedList)
  }

  const isFormValid = computed(() => {
    return formMaker.value.trim().length > 0 && formModel.value.trim().length > 0
  })

  return {
    localDevices,
    isSaving,
    errorMessage,
    editingId,
    formCategory,
    formMaker,
    formModel,
    formCalibrationDate,
    formSerialNumber,
    formNote,
    isFormValid,
    handleSaveItem,
    handleEditItem,
    handleDeleteItem,
    handleCancelEdit,
    resetForm,
  }
}
