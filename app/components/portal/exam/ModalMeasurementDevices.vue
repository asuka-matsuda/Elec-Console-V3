<script setup lang="ts">
/**
 * ModalMeasurementDevices
 * [Organisms] 現場の測定機器（絶縁抵抗計・電圧計・検相器等）を登録・管理するモーダル。
 */
import type {
  MeasurementDevice,
  MeasurementDeviceCategory,
  SelectedMeasurementDevices,
} from '#shared/types/measurementDevice'
import { useMeasurementDeviceForm } from '~/composables/portal/useMeasurementDeviceForm'

const isOpen = defineModel<boolean>({ default: false })

const props = defineProps<{
  siteId: string
  devices: MeasurementDevice[]
  selectedDeviceIds?: SelectedMeasurementDevices
}>()

const emit = defineEmits<{
  (e: 'updated', devices: MeasurementDevice[]): void
}>()

const CATEGORY_OPTIONS = [
  { value: 'megger', label: '絶縁抵抗計' },
  { value: 'voltmeter', label: '電圧計' },
  { value: 'phaseDetector', label: '検相器' },
]

const {
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
  handleEditItem: startEdit,
  handleDeleteItem,
  resetForm,
} = useMeasurementDeviceForm({
  siteId: props.siteId,
  devices: () => props.devices,
  selectedDeviceIds: () => props.selectedDeviceIds,
  isOpen: () => isOpen.value,
  onUpdated: devices => emit('updated', devices),
})

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
