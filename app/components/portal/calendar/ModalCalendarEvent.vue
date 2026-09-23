<script setup lang="ts">
/**
 * ModalCalendarEvent
 * [Organisms] カレンダー予定の新規作成および編集・削除を行うモーダルコンポーネント。
 */
import { computed, ref, watch } from 'vue'

import type { EventFormData } from '~/types/portal'
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

// 初期データ変更時のみフォームとバリデーションを初期化
watch(
  () => props.initialData,
  (newData) => {
    form.value = { ...newData }
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
  <Modal
    v-model="isOpen"
    :title="isEditing ? '予定の編集' : '新しい予定'"
  >
    <div class="flex flex-col gap-3">
      <FormGroup
        label="タイトル"
        required
        :error="hasTitleError ? 'タイトルを入力してください' : undefined"
      >
        <Input
          v-model="form.title"
          placeholder="会議、送電試験など"
          @input="hasTitleError = false"
        />
      </FormGroup>

      <FormGroup label="予定種別">
        <Select
          v-model="form.type"
          :options="typeOptions"
        />
      </FormGroup>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <FormGroup label="開始日時" required>
          <Input
            :key="'start-' + form.allDay"
            v-model="form.start"
            :type="form.allDay ? 'date' : 'datetime-local'"
            required
            @change="handleStartChange"
          />
        </FormGroup>
        <FormGroup label="終了日時">
          <Input
            :key="'end-' + form.allDay"
            v-model="form.end"
            :type="form.allDay ? 'date' : 'datetime-local'"
          />
        </FormGroup>
      </div>

      <Checkbox
        v-model="form.allDay"
        label="終日イベント"
      />
    </div>

    <template #actions>
      <Button
        v-if="isEditing"
        variant="danger"
        icon="trash-2"
        title="予定を削除"
        @click="emit('delete')"
      />
      <Button @click="isOpen = false">
        キャンセル
      </Button>
      <Button
        variant="success"
        icon="check"
        @click="handleSave"
      >
        保存
      </Button>
    </template>
  </Modal>
</template>
