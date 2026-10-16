<script setup lang="ts">
/**
 * ModalCalendarEvent
 * [Organisms] カレンダー予定の新規作成および編集・削除・複製を行うモーダルコンポーネント。
 */
import { computed, ref, watch } from 'vue'

import type { EventFormData } from '#shared/types/calendar'
import { adjustDateRangeForAllDay, calculateAutoEndDate, formatShortDateTime } from '~/utils/date'

const isOpen = defineModel<boolean>({ default: false })

const props = defineProps<{
  isEditing: boolean
  eventTypes: { id: string, name: string, color?: string }[]
  initialData: EventFormData
  siteMembers?: string[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  (e: 'save' | 'duplicate', data: EventFormData): void
  (e: 'delete'): void
}>()

const form = ref<EventFormData>({ ...props.initialData })
const hasTitleError = ref(false)
const hasDateError = ref(false)

// 種別選択肢のキャッシュ（毎描画時のインライン map 生成を引き算）
const typeOptions = computed(() =>
  props.eventTypes.map(t => ({ label: t.name, value: t.id })),
)

const modalTitle = computed(() => {
  if (props.readonly) {
    return form.value.isMilestone ? 'マイルストーンの詳細' : '予定の詳細'
  }

  return props.isEditing
    ? (form.value.isMilestone ? 'マイルストーンの編集' : '予定の編集')
    : (form.value.isMilestone ? '新しいマイルストーン' : '新しい予定')
})

const hasAuditInfo = computed(() =>
  Boolean(
    props.isEditing
    && (form.value.createdBy || form.value.updatedBy || form.value.createdAt || form.value.updatedAt),
  ),
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
    hasDateError.value = false
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
  hasDateError.value = false
}

const handleEndChange = () => {
  hasDateError.value = false
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
      hasDateError.value = false
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
    hasDateError.value = false
  },
)

const isAssigned = (member: string): boolean => {
  return Array.isArray(form.value.assignees) && form.value.assignees.includes(member)
}

const toggleAssignee = (member: string, checked: unknown) => {
  const current = Array.isArray(form.value.assignees) ? [...form.value.assignees] : []

  if (checked) {
    if (!current.includes(member)) {
      current.push(member)
    }
  }
  else {
    const idx = current.indexOf(member)

    if (idx !== -1) {
      current.splice(idx, 1)
    }
  }
  form.value.assignees = current
}

const handleDuplicate = () => {
  emit('duplicate', { ...form.value })
}

const handleSave = () => {
  if (props.readonly) return

  if (!form.value.title.trim()) {
    hasTitleError.value = true

    return
  }

  if (
    !form.value.isMilestone
    && form.value.start
    && form.value.end
    && form.value.start > form.value.end
  ) {
    hasDateError.value = true

    return
  }

  hasTitleError.value = false
  hasDateError.value = false
  emit('save', form.value)
}
</script>

<template>
  <Modal v-model="isOpen" :title="modalTitle">
    <div class="flex flex-col gap-form-row-gap">
      <Toggle v-model="form.isMilestone" label="マイルストーン（重要工程期日）として登録" :disabled="props.readonly" />

      <div class="flex flex-col gap-inline-gap">
        <label for="calendar-event-title" class="label">
          タイトル <span class="req-mark">*</span>
        </label>
        <Input
          id="calendar-event-title"
          v-model="form.title"
          :placeholder="form.isMilestone ? '受電・本送電、消防検査など' : '会議、送電試験など'"
          :error="hasTitleError"
          :disabled="props.readonly"
          @update:model-value="hasTitleError = false"
        />
        <p v-if="hasTitleError" class="error-text">
          タイトルを入力してください
        </p>
      </div>

      <div v-if="!form.isMilestone" class="flex flex-col gap-inline-gap">
        <label for="calendar-event-type" class="label">予定種別</label>
        <Select id="calendar-event-type" v-model="form.type" :options="typeOptions" :disabled="props.readonly" />
      </div>

      <div v-if="form.isMilestone" class="flex flex-col gap-inline-gap">
        <label for="calendar-event-start" class="label">
          目標日 <span class="req-mark">*</span>
        </label>
        <Input id="calendar-event-start" v-model="form.start" type="date" required :disabled="props.readonly" />
      </div>

      <template v-else>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-form-col-gap">
          <div class="flex flex-col gap-inline-gap">
            <label for="calendar-event-start" class="label">
              開始日時 <span class="req-mark">*</span>
            </label>
            <Input
              id="calendar-event-start"
              :key="'start-' + form.allDay"
              v-model="form.start"
              :type="form.allDay ? 'date' : 'datetime-local'"
              :disabled="props.readonly"
              required
              @change="handleStartChange"
            />
          </div>
          <div class="flex flex-col gap-inline-gap">
            <label for="calendar-event-end" class="label">終了日時</label>
            <Input
              id="calendar-event-end"
              :key="'end-' + form.allDay"
              v-model="form.end"
              :type="form.allDay ? 'date' : 'datetime-local'"
              :error="hasDateError"
              :disabled="props.readonly"
              @update:model-value="handleEndChange"
            />
          </div>
        </div>

        <p v-if="hasDateError" class="error-text">
          終了日時は開始日時以降を指定してください
        </p>

        <Toggle v-model="form.allDay" label="終日イベント" :disabled="props.readonly" />
      </template>

      <div class="flex flex-col gap-inline-gap">
        <label for="calendar-event-location" class="label">場所・対象エリア</label>
        <Input
          id="calendar-event-location"
          v-model="form.location"
          icon="map-pin"
          placeholder="1F 電気室、2F 電灯盤、現場事務所など"
          :disabled="props.readonly"
          clearable
        />
      </div>

      <div v-if="siteMembers && siteMembers.length > 0" class="flex flex-col gap-inline-gap">
        <span class="label">担当者・関係者</span>
        <ul class="flex flex-wrap gap-item-gap">
          <li v-for="member in siteMembers" :key="member">
            <Checkbox
              :model-value="isAssigned(member)"
              :label="member"
              :disabled="props.readonly"
              @update:model-value="toggleAssignee(member, $event)"
            />
          </li>
        </ul>
      </div>

      <div class="flex flex-col gap-inline-gap">
        <label for="calendar-event-description" class="label">備考・詳細メモ</label>
        <Textarea
          id="calendar-event-description"
          v-model="form.description"
          :rows="3"
          placeholder="集合場所、持参物、立会者名、注意事項など"
          :disabled="props.readonly"
        />
      </div>

      <div v-if="hasAuditInfo" class="panel is-sunken p-panel-pad-compact flex flex-col gap-micro-gap">
        <div v-if="form.createdBy || form.createdAt" class="flex items-center justify-between gap-inline-gap">
          <small class="flex items-center gap-micro-gap">
            <Icon name="user" size="sm" />
            <span>登録: <strong>{{ form.createdBy || '未記録' }}</strong></span>
          </small>
          <time v-if="form.createdAt">{{ formatShortDateTime(form.createdAt) }}</time>
        </div>
        <div v-if="form.updatedBy || form.updatedAt" class="flex items-center justify-between gap-inline-gap">
          <small class="flex items-center gap-micro-gap">
            <Icon name="history" size="sm" />
            <span>最終更新: <strong>{{ form.updatedBy || form.createdBy || '未記録' }}</strong></span>
          </small>
          <time v-if="form.updatedAt">{{ formatShortDateTime(form.updatedAt) }}</time>
        </div>
      </div>
    </div>

    <template #footer>
      <Tooltip v-if="isEditing && !props.readonly" text="削除">
        <Button variant="danger" size="sm" icon="trash-2" @click="emit('delete')" />
      </Tooltip>
      <Tooltip v-if="isEditing && !props.readonly" text="この予定を複製して新規作成">
        <Button variant="secondary" size="sm" icon="copy" @click="handleDuplicate">複製</Button>
      </Tooltip>
      <Button @click="isOpen = false">{{ props.readonly ? '閉じる' : 'キャンセル' }}</Button>
      <Button v-if="!props.readonly" variant="primary" icon="check" @click="handleSave">保存する</Button>
    </template>
  </Modal>
</template>
