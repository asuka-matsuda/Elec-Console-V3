<script setup lang="ts">
import { ref, watch } from 'vue'

import type { EventFormData } from '~/types/portal'

import CalendarDateInput from './CalendarDateInput.vue'

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

const autoFillEndDate = () => {
  const startVal = form.value.start

  if (!startVal) return

  const startDate = new Date(startVal)

  if (isNaN(startDate.getTime())) return

  const endDate = form.value.end ? new Date(form.value.end) : null

  if (
    !form.value.end
    || !endDate
    || isNaN(endDate.getTime())
    || endDate < startDate
  ) {
    if (form.value.allDay) {
      form.value.end = startVal.split('T')[0] || ''
    }
    else {
      const newEnd = new Date(startDate.getTime() + 60 * 60 * 1000)

      form.value.end
        = newEnd.getFullYear()
          + '-'
          + String(newEnd.getMonth() + 1).padStart(2, '0')
          + '-'
          + String(newEnd.getDate()).padStart(2, '0')
          + 'T'
          + String(newEnd.getHours()).padStart(2, '0')
          + ':'
          + String(newEnd.getMinutes()).padStart(2, '0')
    }
  }
}

watch(() => form.value.start, autoFillEndDate)

watch(
  () => form.value.end,
  (newEnd) => {
    if (!newEnd) autoFillEndDate() // ユーザーが空にした時に自動補完
  },
)

watch(
  () => form.value.allDay,
  (isAllDay) => {
    if (!form.value.start) return
    if (isAllDay) {
      form.value.start = form.value.start.split('T')[0] || ''
      if (form.value.end) form.value.end = form.value.end.split('T')[0] || ''
    }
    else {
      if (!form.value.start.includes('T')) form.value.start += 'T09:00'
      if (form.value.end && !form.value.end.includes('T'))
        form.value.end += 'T10:00'
    }
    autoFillEndDate()
  },
)

watch(
  () => props.initialData,
  (newData) => {
    form.value = { ...newData }
    hasTitleError.value = false
  },
  { deep: true, immediate: true },
)

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
      <AppFormGroup
        label="タイトル"
        required
        :error="hasTitleError ? 'タイトルを入力してください' : undefined"
      >
        <AppInput
          v-model="form.title"
          placeholder="会議、送電試験など"
          :error="hasTitleError"
        />
      </AppFormGroup>

      <AppFormGroup label="予定種別">
        <AppSelect
          v-model="form.type"
          :options="eventTypes.map((t) => ({ label: t.name, value: t.id }))"
        />
      </AppFormGroup>

      <div class="p-event-form__row">
        <AppFormGroup label="開始日時" required>
          <CalendarDateInput
            :key="'start-' + form.allDay"
            v-model="form.start"
            :type="form.allDay ? 'date' : 'datetime-local'"
            required
          />
        </AppFormGroup>
        <AppFormGroup label="終了日時">
          <CalendarDateInput
            :key="'end-' + form.allDay"
            v-model="form.end"
            :type="form.allDay ? 'date' : 'datetime-local'"
          />
        </AppFormGroup>
      </div>

      <AppCheckbox v-model="form.allDay" label="終日イベント" />
    </div>

    <template #footer>
      <AppButton
        v-if="isEditing"
        variant="danger"
        style="margin-right: auto"
        @click="handleDelete"
      >
        削除
      </AppButton>
      <AppButton variant="secondary" @click="closeModal">
        キャンセル
      </AppButton>
      <AppButton variant="primary" @click="handleSave">
        保存
      </AppButton>
    </template>
  </AppModal>
</template>

<style scoped lang="scss">
.p-event-form {
  @include flex-start-stretch($direction: column);

  gap: var(--space-3);

  &__row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-2);

    @include mq("sm") {
      grid-template-columns: 1fr;
    }
  }
}
</style>
