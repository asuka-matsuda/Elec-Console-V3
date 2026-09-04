<script setup lang="ts">
import { ref, watch } from 'vue'

import type { EventFormData } from '~/types/portal'
import { adjustDateRangeForAllDay, calculateAutoEndDate } from '~/utils/date'

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
  form.value.end = calculateAutoEndDate(
    form.value.start,
    form.value.end,
    form.value.allDay,
  )
}

watch(() => form.value.start, autoFillEndDate)

watch(
  () => form.value.end,
  (newEnd) => {
    if (!newEnd) autoFillEndDate()
  },
)

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
