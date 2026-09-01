<script setup lang="ts">
import { ref, watch } from 'vue'

import CalendarDateInput from './CalendarDateInput.vue'

export interface EventFormData {
  title: string
  type: string
  start: string
  end: string
  allDay: boolean
}

const props = defineProps<{
  modelValue: boolean
  isEditing: boolean
  eventTypes: { id: string, name: string, color?: string }[]
  initialData: EventFormData
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', data: EventFormData): void
  (e: 'delete'): void
}>()

const form = ref<EventFormData>({ ...props.initialData })
const hasTitleError = ref(false)

// 自動補完ロジック
const autoFillEndDate = () => {
  const startVal = form.value.start

  if (!startVal) return

  const startDate = new Date(startVal)

  if (isNaN(startDate.getTime())) return

  const endDate = form.value.end ? new Date(form.value.end) : null

  if (!form.value.end || !endDate || isNaN(endDate.getTime()) || endDate < startDate) {
    if (form.value.allDay) {
      form.value.end = (startVal.split('T')[0] || '')
    }
    else {
      const newEnd = new Date(startDate.getTime() + 60 * 60 * 1000)

      form.value.end = newEnd.getFullYear() + '-'
        + String(newEnd.getMonth() + 1).padStart(2, '0') + '-'
        + String(newEnd.getDate()).padStart(2, '0') + 'T'
        + String(newEnd.getHours()).padStart(2, '0') + ':'
        + String(newEnd.getMinutes()).padStart(2, '0')
    }
  }
}

watch(() => form.value.start, autoFillEndDate)

watch(() => form.value.end, (newEnd) => {
  if (!newEnd) autoFillEndDate() // ユーザーが空にした時に自動補完
})

watch(() => form.value.allDay, (isAllDay) => {
  if (!form.value.start) return
  if (isAllDay) {
    form.value.start = (form.value.start.split('T')[0] || '')
    if (form.value.end) form.value.end = (form.value.end.split('T')[0] || '')
  }
  else {
    if (!form.value.start.includes('T')) form.value.start += 'T09:00'
    if (form.value.end && !form.value.end.includes('T')) form.value.end += 'T10:00'
  }
  autoFillEndDate()
})

watch(() => props.initialData, (newData) => {
  form.value = { ...newData }
  hasTitleError.value = false
}, { deep: true, immediate: true })

const handleSave = () => {
  if (!form.value.title.trim()) {
    hasTitleError.value = true

    return
  }
  hasTitleError.value = false
  emit('save', form.value)
}

const handleDelete = () => {
  emit('delete')
}

const closeModal = () => {
  emit('update:modelValue', false)
}
</script>

<template>
  <AppModal
    :model-value="modelValue"
    :title="isEditing ? '予定の編集' : '新しい予定'"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="p-event-form">
      <div class="p-event-form__field">
        <label>タイトル</label>
        <AppInput
          v-model="form.title"
          placeholder="会議、送電試験など"
          required
          :error="hasTitleError"
        />
        <span
          v-if="hasTitleError"
          class="p-event-form__error"
        >タイトルを入力してください</span>
      </div>
      <div class="p-event-form__field">
        <label>予定種別</label>
        <AppSelect
          v-model="form.type"
          :options="eventTypes.map(t => ({ label: t.name, value: t.id }))"
        />
      </div>

      <div class="p-event-form__row">
        <div class="p-event-form__field">
          <label>開始日時</label>
          <CalendarDateInput
            :key="'start-' + form.allDay"
            v-model="form.start"
            :type="form.allDay ? 'date' : 'datetime-local'"
            required
          />
        </div>
        <div class="p-event-form__field">
          <label>終了日時</label>
          <CalendarDateInput
            :key="'end-' + form.allDay"
            v-model="form.end"
            :type="form.allDay ? 'date' : 'datetime-local'"
          />
        </div>
      </div>

      <AppCheckbox
        v-model="form.allDay"
        label="終日イベント"
      />

      <div class="p-event-form__actions">
        <AppButton
          v-if="isEditing"
          variant="danger"
          @click="handleDelete"
        >
          削除
        </AppButton>
        <div style="flex: 1"></div>
        <AppButton
          variant="secondary"
          @click="closeModal"
        >
          キャンセル
        </AppButton>
        <AppButton
          variant="primary"
          @click="handleSave"
        >
          保存
        </AppButton>
      </div>
    </div>
  </AppModal>
</template>

<style scoped lang="scss">
.p-event-form {
  @include flex-start-stretch($direction: column);

  container-type: inline-size;
  gap: var(--space-stack-gap);

  &__field {
    @include flex-start-stretch($direction: column);

    gap: var(--space-1);

    label {
      @include text-label;

      color: var(--color-text-muted);
    }
  }

  &__error {
    @include text-caption;

    color: var(--color-status-danger);
  }

  &__row {
    @include flex-start-center;

    gap: var(--space-inline-gap);
    > * { flex: 1; }

    @include cq("xs", "down") {
      flex-direction: column;
      align-items: stretch;
    }
  }

  &__actions {
    @include flex-start-center;

    gap: var(--space-inline-gap);
    padding-top: var(--space-card-pad-md);
    border-top: var(--border-width-base) solid var(--color-border);
  }
}
</style>
