<script setup lang="ts">
import { ref, watch } from 'vue'

import type { EventFormData } from '~/types/portal'
import { adjustDateRangeForAllDay, calculateAutoEndDate } from '~/utils/date'

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
    <div class="event-form">
      <MoleculesFormGroup
        label="タイトル"
        required
        :error="hasTitleError ? 'タイトルを入力してください' : undefined"
      >
        <AtomsInput
          v-model="form.title"
          placeholder="会議、送電試験など"
          :error="hasTitleError"
        />
      </MoleculesFormGroup>

      <MoleculesFormGroup label="予定種別">
        <AtomsSelect
          v-model="form.type"
          :options="eventTypes.map((t) => ({ label: t.name, value: t.id }))"
        />
      </MoleculesFormGroup>

      <div class="event-form__row">
        <MoleculesFormGroup label="開始日時" required>
          <AtomsInput
            :key="'start-' + form.allDay"
            v-model="form.start"
            :type="form.allDay ? 'date' : 'datetime-local'"
            required
          />
        </MoleculesFormGroup>
        <MoleculesFormGroup label="終了日時">
          <AtomsInput
            :key="'end-' + form.allDay"
            v-model="form.end"
            :type="form.allDay ? 'date' : 'datetime-local'"
          />
        </MoleculesFormGroup>
      </div>

      <AtomsCheckbox v-model="form.allDay" label="終日イベント" />
    </div>

    <template #footer>
      <AtomsButton
        v-if="isEditing"
        variant="danger"
        style="margin-right: auto"
        @click="handleDelete"
      >
        削除
      </AtomsButton>
      <AtomsButton variant="secondary" @click="closeModal">
        キャンセル
      </AtomsButton>
      <AtomsButton variant="primary" @click="handleSave">
        保存
      </AtomsButton>
    </template>
  </AppModal>
</template>

<style scoped lang="scss">
.event-form {
  display: flex;
  flex-direction: column;
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
