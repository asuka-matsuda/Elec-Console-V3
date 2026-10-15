<script setup lang="ts">
/**
 * ModalCalendarEvent
 * [Organisms] カレンダー予定の新規作成および編集・削除を行うモーダルコンポーネント。
 */
import { computed, ref, watch } from 'vue'

import type { EventFormData } from '#shared/types/calendar'
import { adjustDateRangeForAllDay, calculateAutoEndDate } from '~/utils/date'

const isOpen = defineModel<boolean>({ default: false })

const props = defineProps<{
  isEditing: boolean
  eventTypes: { id: string, name: string, color?: string }[]
  initialData: EventFormData
}>()

const emit = defineEmits<{
  (e: 'save', data: EventFormData): void
  (e: 'delete'): void
}>()

const form = ref<EventFormData>({ ...props.initialData })
const hasTitleError = ref(false)

// 種別選択肢のキャッシュ（毎描画時のインライン map 生成を引き算）
const typeOptions = computed(() =>
  props.eventTypes.map(t => ({ label: t.name, value: t.id })),
)

// 初期データまたは種別一覧変更時にフォームとバリデーションを初期化
watch(
  () => [props.initialData, props.eventTypes] as const,
  ([newData, types]) => {
    const validType = types.some(t => t.id === newData.type)
      ? newData.type
      : (types[0]?.id || newData.type)

    form.value = { ...newData, type: validType }
    hasTitleError.value = false
  },
  { deep: true, immediate: true },
)

// 開始日時の変更確定時のみ、終了日時を自動補完
const handleStartChange = () => {
  form.value.end = calculateAutoEndDate(
    form.value.start,
    form.value.end,
    form.value.allDay,
  )
}

// マイルストーン切り替え時は自動的に単一日付（終日）へ正規化
watch(
  () => form.value.isMilestone,
  (isMilestone) => {
    if (isMilestone) {
      form.value.allDay = true
      const dateOnly = form.value.start.split('T')[0] || form.value.start

      form.value.start = dateOnly
      form.value.end = dateOnly
    }
  },
)

// 終日フラグの切り替え時に日時フォーマットを調整
watch(
  () => form.value.allDay,
  (isAllDay) => {
    const adjusted = adjustDateRangeForAllDay(
      form.value.start,
      form.value.end,
      isAllDay,
    )

    form.value.start = adjusted.start
    form.value.end = adjusted.end
  },
)

const handleSave = () => {
  if (!form.value.title.trim()) {
    hasTitleError.value = true

    return
  }
  hasTitleError.value = false
  emit('save', form.value)
}
</script>

<template>
  <Modal v-model="isOpen" :title="isEditing ? (form.isMilestone ? 'マイルストーンの編集' : '予定の編集') : (form.isMilestone ? '新しいマイルストーン' : '新しい予定')">
    <div class="flex flex-col gap-form-row-gap">
      <Toggle v-model="form.isMilestone" label="マイルストーン（重要工程期日）として登録" />

      <div class="flex flex-col gap-inline-gap">
        <label for="calendar-event-title" class="label">
          タイトル <span class="required-mark">*</span>
        </label>
        <Input id="calendar-event-title" v-model="form.title" :placeholder="form.isMilestone ? '受電・本送電、消防検査など' : '会議、送電試験など'" :error="hasTitleError" @update:model-value="hasTitleError = false" />
        <p v-if="hasTitleError" class="error-text">
          タイトルを入力してください
        </p>
      </div>

      <div v-if="!form.isMilestone" class="flex flex-col gap-inline-gap">
        <label for="calendar-event-type" class="label">予定種別</label>
        <Select id="calendar-event-type" v-model="form.type" :options="typeOptions" />
      </div>

      <div v-if="form.isMilestone" class="flex flex-col gap-inline-gap">
        <label for="calendar-event-start" class="label">
          目標日 <span class="required-mark">*</span>
        </label>
        <Input id="calendar-event-start" v-model="form.start" type="date" required />
      </div>

      <template v-else>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-form-col-gap">
          <div class="flex flex-col gap-inline-gap">
            <label for="calendar-event-start" class="label">
              開始日時 <span class="required-mark">*</span>
            </label>
            <Input id="calendar-event-start" :key="'start-' + form.allDay" v-model="form.start" :type="form.allDay ? 'date' : 'datetime-local'" required @change="handleStartChange" />
          </div>
          <div class="flex flex-col gap-inline-gap">
            <label for="calendar-event-end" class="label">終了日時</label>
            <Input id="calendar-event-end" :key="'end-' + form.allDay" v-model="form.end" :type="form.allDay ? 'date' : 'datetime-local'" />
          </div>
        </div>

        <Toggle v-model="form.allDay" label="終日イベント" />
      </template>
    </div>

    <template #footer>
      <Tooltip v-if="isEditing" text="削除">
        <Button variant="danger" size="sm" icon="trash-2" @click="emit('delete')" />
      </Tooltip>
      <Button @click="isOpen = false">キャンセル</Button>
      <Button variant="primary" icon="check" @click="handleSave">保存する</Button>
    </template>
  </Modal>
</template>
