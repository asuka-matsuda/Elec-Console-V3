<script setup lang="ts">
/**
 * PortalOrganismsCalEventModal
 * [Organisms] カレンダー予定の新規作成および編集・削除を行うモーダルコンポーネント。
 */
import { ref, watch } from 'vue'

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
  isOpen.value = false
}
</script>

<template>
  <OrganismsModal
    v-model="isOpen"
    :title="isEditing ? '予定の編集' : '新しい予定'"
  >
    <div class="flex flex-col gap-3">
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

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

      <Checkbox v-model="form.allDay" label="終日イベント" />
    </div>

    <template #footer>
      <Button
        v-if="isEditing"
        variant="danger"
        icon="trash-2"
        class="mr-auto"
        @click="handleDelete"
      >
        削除
      </Button>
      <Button @click="closeModal">
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
  </OrganismsModal>
</template>
