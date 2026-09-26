<script setup lang="ts">
/**
 * ModalMeasurementDevices
 * [Organisms] 現場の測定機器（絶縁抵抗計・電圧計・検相器等）を登録・管理するモーダル。
 */
import { computed, ref, watch } from 'vue'

import type {
  MeasurementDevice,
  MeasurementDeviceCategory,
  SelectedMeasurementDevices,
} from '#shared/types/measurementDevice'
import { useApi } from '~/composables/useApi'

const isOpen = defineModel<boolean>({ default: false })

const props = defineProps<{
  siteId: string
  devices: MeasurementDevice[]
  selectedDeviceIds?: SelectedMeasurementDevices
}>()

const emit = defineEmits<{
  (e: 'updated', devices: MeasurementDevice[]): void
}>()

const { $api } = useApi()

const CATEGORY_OPTIONS = [
  { value: 'megger', label: '絶縁抵抗計' },
  { value: 'voltmeter', label: '電圧計' },
  { value: 'phaseDetector', label: '検相器' },
]

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

// Props の devices が変わったら同期
watch(
  () => props.devices,
  (val) => {
    localDevices.value = JSON.parse(JSON.stringify(val || []))
  },
  { immediate: true, deep: true },
)

// モーダルが開いたときにフォームリセット
watch(
  isOpen,
  (open) => {
    if (open) {
      resetForm()
      errorMessage.value = null
    }
  },
)

const resetForm = () => {
  editingId.value = null
  formCategory.value = 'megger'
  formMaker.value = ''
  formModel.value = ''
  formCalibrationDate.value = ''
  formSerialNumber.value = ''
  formNote.value = ''
}

const startEdit = (dev: MeasurementDevice) => {
  editingId.value = dev.id
  formCategory.value = dev.category
  formMaker.value = dev.maker
  formModel.value = dev.model
  formCalibrationDate.value = dev.calibrationDate
  formSerialNumber.value = dev.serialNumber
  formNote.value = dev.note || ''
}

const getCategoryLabel = (category: MeasurementDeviceCategory): string => {
  switch (category) {
    case 'megger':
      return '絶縁抵抗計'
    case 'voltmeter':
      return '電圧計'
    case 'phaseDetector':
      return '検相器'
    default:
      return '測定器'
  }
}

const getCategoryBadgeColor = (category: MeasurementDeviceCategory): string => {
  switch (category) {
    case 'megger':
      return 'var(--color-primary)'
    case 'voltmeter':
      return 'var(--color-warning)'
    case 'phaseDetector':
      return 'var(--color-category-main)'
    default:
      return 'var(--color-text-muted)'
  }
}

// フォーム送信（追加または編集保存）
const handleSaveItem = async () => {
  errorMessage.value = null

  if (!formMaker.value.trim() || !formModel.value.trim()) {
    errorMessage.value = '製造者（メーカー）と型式を入力してください'

    return
  }

  const updatedList = [...localDevices.value]

  if (editingId.value) {
    // 既存更新
    const idx = updatedList.findIndex(d => d.id === editingId.value)

    if (idx !== -1) {
      updatedList[idx] = {
        id: editingId.value,
        category: formCategory.value,
        maker: formMaker.value.trim(),
        model: formModel.value.trim(),
        calibrationDate: formCalibrationDate.value.trim(),
        serialNumber: formSerialNumber.value.trim(),
        note: formNote.value.trim() || undefined,
      }
    }
  }
  else {
    // 新規追加
    const newId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

    updatedList.push({
      id: newId,
      category: formCategory.value,
      maker: formMaker.value.trim(),
      model: formModel.value.trim(),
      calibrationDate: formCalibrationDate.value.trim(),
      serialNumber: formSerialNumber.value.trim(),
      note: formNote.value.trim() || undefined,
    })
  }

  await persistDevices(updatedList)
  resetForm()
}

// 削除
const handleDeleteItem = async (id: string) => {
  if (editingId.value === id) {
    resetForm()
  }

  const updatedList = localDevices.value.filter(d => d.id !== id)

  await persistDevices(updatedList)
}

// API保存
const persistDevices = async (list: MeasurementDevice[]) => {
  isSaving.value = true
  errorMessage.value = null

  try {
    const res = await $api<{ devices: MeasurementDevice[] }>(
      `/api/sites/${props.siteId}/measurement-devices`,
      {
        method: 'PUT',
        body: {
          devices: list,
          selectedDeviceIds: props.selectedDeviceIds,
        },
      },
    )

    localDevices.value = res.devices || list
    emit('updated', localDevices.value)
  }
  catch (err: unknown) {
    const errorObj = err as Error

    errorMessage.value = errorObj.message || '機器台帳の保存に失敗しました'
  }
  finally {
    isSaving.value = false
  }
}

const isFormValid = computed(() => {
  return formMaker.value.trim().length > 0 && formModel.value.trim().length > 0
})
</script>

<template>
  <Modal
    v-model="isOpen"
    title="測定機器台帳の管理"
    icon="tool"
  >
    <div class="flex flex-col gap-panel-gap">
      <Disclaimer
        text="現場で使用する測定機器（絶縁計・電圧計・検相器等）を登録します。登録した機器は帳票印刷時にドロップダウンで選択できます。"
      />

      <Disclaimer
        v-if="errorMessage"
        :text="errorMessage"
      />

      <Panel as="section" class="flex flex-col gap-form-row-gap">
        <SectionHeader
          :title="editingId ? '機器情報の編集' : '新しい測定機器の追加'"
          icon="plus-circle"
          tag="h4"
          variant="hud"
        />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-form-row-gap">
          <FormGroup label="機器種別" required>
            <Select
              v-model="formCategory"
              :options="CATEGORY_OPTIONS"
            />
          </FormGroup>

          <FormGroup label="製造者 (メーカー)" required>
            <Input
              v-model="formMaker"
              placeholder="例: 日置電機、共立電気計器"
            />
          </FormGroup>

          <FormGroup label="型式" required>
            <Input
              v-model="formModel"
              placeholder="例: IR4052-11, 2002PA"
            />
          </FormGroup>

          <FormGroup label="校正年月日">
            <Input
              v-model="formCalibrationDate"
              placeholder="例: 2026/04/01"
            />
          </FormGroup>

          <FormGroup label="製造番号 (シリアル)">
            <Input
              v-model="formSerialNumber"
              placeholder="例: 230512345"
            />
          </FormGroup>

          <FormGroup label="備考 (所有者/メモ)">
            <Input
              v-model="formNote"
              placeholder="例: A班共用、松田所有"
            />
          </FormGroup>
        </div>

        <div class="flex justify-end gap-item-gap pt-item-gap">
          <Button
            v-if="editingId"
            variant="default"
            @click="resetForm"
          >
            キャンセル
          </Button>

          <Button
            variant="default"
            :icon="editingId ? 'check' : 'plus'"
            :loading="isSaving"
            :disabled="!isFormValid"
            @click="handleSaveItem"
          >
            {{ editingId ? '変更を反映' : '機器を追加' }}
          </Button>
        </div>
      </Panel>

      <Divider />

      <div class="flex flex-col gap-item-gap">
        <SectionHeader
          title="登録済みの測定機器"
          icon="list"
          tag="h4"
          variant="hud"
        >
          <template #actions>
            <span class="count-badge">全 {{ localDevices.length }} 台</span>
          </template>
        </SectionHeader>

        <EmptyState
          v-if="localDevices.length === 0"
          message="登録されている測定機器はありません。上のフォームから追加してください。"
        />

        <ul
          v-else
          class="flex flex-col gap-item-gap max-h-[320px] overflow-y-auto pr-inline-gap list-none m-0 p-0"
        >
          <Panel
            v-for="dev in localDevices"
            :key="dev.id"
            as="li"
            padding="compact"
            class="flex items-center justify-between gap-item-gap"
          >
            <div class="flex flex-col gap-inline-gap min-w-0 flex-1">
              <div class="flex items-center gap-item-gap flex-wrap">
                <Badge :color="getCategoryBadgeColor(dev.category)">
                  {{ getCategoryLabel(dev.category) }}
                </Badge>
                <strong>
                  {{ dev.maker }} {{ dev.model }}
                </strong>
                <small v-if="dev.note">
                  ({{ dev.note }})
                </small>
              </div>

              <small class="flex items-center gap-form-row-gap flex-wrap">
                <span>校正日: {{ dev.calibrationDate || '未設定' }}</span>
                <span>製番: {{ dev.serialNumber || '未設定' }}</span>
              </small>
            </div>

            <div class="flex items-center gap-inline-gap shrink-0">
              <Button
                variant="default"
                icon="edit"
                icon-only
                title="編集"
                @click="startEdit(dev)"
              />
              <Button
                variant="default"
                icon="trash-2"
                icon-only
                title="削除"
                @click="handleDeleteItem(dev.id)"
              />
            </div>
          </Panel>
        </ul>
      </div>
    </div>
  </Modal>
</template>
