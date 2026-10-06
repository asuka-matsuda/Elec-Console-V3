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
import type { BadgeVariant, SelectOption } from '~/types/components'

const isOpen = defineModel<boolean>({ default: false })

const props = defineProps<{
  siteId: string
  devices: MeasurementDevice[]
  selectedDeviceIds?: SelectedMeasurementDevices
}>()

const emit = defineEmits<{
  (e: 'updated', devices: MeasurementDevice[]): void
}>()

const CATEGORY_LABEL_MAP: Record<MeasurementDeviceCategory, string> = {
  megger: '絶縁抵抗計',
  voltmeter: '電圧計',
  phaseDetector: '検相器',
}

const CATEGORY_VARIANT_MAP: Record<MeasurementDeviceCategory, BadgeVariant> = {
  megger: 'purple',
  voltmeter: 'amber',
  phaseDetector: 'blue',
}

const CATEGORY_OPTIONS: SelectOption<string>[] = (
  Object.entries(CATEGORY_LABEL_MAP) as [MeasurementDeviceCategory, string][]
).map(([value, label]) => ({
  value,
  label,
}))

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
  return CATEGORY_LABEL_MAP[category] ?? '測定器'
}

const getCategoryBadgeVariant = (category: MeasurementDeviceCategory): BadgeVariant => {
  return CATEGORY_VARIANT_MAP[category] ?? 'gray'
}
</script>

<template>
  <Modal v-model="isOpen" title="測定機器台帳の管理" icon="wrench">
    <div class="flex flex-col gap-panel-gap">
      <p class="lead-text">
        現場で使用する測定機器（絶縁計・電圧計・検相器等）を登録します。登録した機器は帳票印刷時にドロップダウンで選択できます。
      </p>

      <Note v-if="errorMessage" variant="error" :text="errorMessage" />

      <section class="flex flex-col gap-form-row-gap">
        <header class="flex items-center gap-item-gap">
          <h4 class="flex items-center gap-item-gap">
            <Icon name="circle-plus" />
            <span>{{ editingId ? '機器情報の編集' : '新しい測定機器の追加' }}</span>
          </h4>
        </header>
        <hr class="divider">

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-form-row-gap">
          <div class="flex flex-col gap-inline-gap">
            <label for="device-category" class="label">機器種別 <span class="req-mark">＊</span></label>
            <Select id="device-category" v-model="formCategory" :options="CATEGORY_OPTIONS" />
          </div>

          <div class="flex flex-col gap-inline-gap">
            <label for="device-maker" class="label">製造者 (メーカー) <span class="req-mark">＊</span></label>
            <Input id="device-maker" v-model="formMaker" placeholder="例: 日置電機、共立電気計器" />
          </div>

          <div class="flex flex-col gap-inline-gap">
            <label for="device-model" class="label">型式 <span class="req-mark">＊</span></label>
            <Input id="device-model" v-model="formModel" placeholder="例: IR4052-11, 2002PA" />
          </div>

          <div class="flex flex-col gap-inline-gap">
            <label for="device-cal-date" class="label">校正年月日</label>
            <Input id="device-cal-date" v-model="formCalibrationDate" placeholder="例: 2026/04/01" />
          </div>

          <div class="flex flex-col gap-inline-gap">
            <label for="device-serial" class="label">製造番号 (シリアル)</label>
            <Input id="device-serial" v-model="formSerialNumber" placeholder="例: 230512345" />
          </div>

          <div class="flex flex-col gap-inline-gap">
            <label for="device-note" class="label">備考 (所有者/メモ)</label>
            <Input id="device-note" v-model="formNote" placeholder="例: A班共用、松田所有" />
          </div>
        </div>

        <div class="flex justify-end gap-item-gap pt-item-gap">
          <Button v-if="editingId" variant="secondary" size="sm" @click="resetForm">キャンセル</Button>

          <Button variant="primary" size="sm" :icon="editingId ? 'check' : 'plus'" :loading="isSaving" :disabled="!isFormValid" @click="handleSaveItem">{{ editingId ? '変更を反映する' : '機器を追加する' }}</Button>
        </div>
      </section>

      <hr class="divider">

      <div class="flex flex-col gap-item-gap">
        <header class="flex items-center justify-between gap-y-inline-gap gap-x-item-gap">
          <h4 class="flex items-center gap-item-gap">
            <Icon name="list" />
            <span>登録済みの測定機器</span>
          </h4>
          <div class="flex items-center gap-item-gap">
            <Badge>全 {{ localDevices.length }} 台</Badge>
          </div>
        </header>
        <hr class="divider">

        <EmptyState v-if="localDevices.length === 0" icon="wrench" title="測定機器が登録されていません" description="上のフォームから測定機器を追加してください。" />

        <ul v-else class="flex flex-col gap-item-gap max-h-[320px] overflow-y-auto pr-inline-gap">
          <li v-for="dev in localDevices" :key="dev.id">
            <div class="panel p-panel-pad-compact flex items-center justify-between gap-item-gap" :class="{ 'is-active': editingId === dev.id }">
              <div class="flex flex-col gap-inline-gap min-w-0 flex-1">
                <div class="flex items-center gap-item-gap flex-wrap">
                  <Badge :variant="getCategoryBadgeVariant(dev.category)">{{ getCategoryLabel(dev.category) }}</Badge>
                  <strong>{{ dev.maker }} {{ dev.model }}</strong>
                  <small v-if="dev.note">({{ dev.note }})</small>
                </div>

                <small class="flex items-center gap-form-row-gap flex-wrap">
                  <span>校正日: {{ dev.calibrationDate || '未設定' }}</span>
                  <span>製番: {{ dev.serialNumber || '未設定' }}</span>
                </small>
              </div>

              <div class="flex items-center shrink-0">
                <Menu :items="[{ label: '機器を編集…', icon: 'edit', action: () => startEdit(dev) }, { label: '機器を削除', icon: 'trash-2', variant: 'danger', divider: true, action: () => handleDeleteItem(dev.id) }]" />
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </Modal>
</template>

<style scoped lang="scss">
.lead-text {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-base);
  color: var(--color-text-sub);
}
</style>
