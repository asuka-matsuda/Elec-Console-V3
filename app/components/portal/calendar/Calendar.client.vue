<script setup lang="ts">
/**
 * PortalCalendar
 * [Portal Organisms] 現場専用スケジュールカレンダー。
 * FullCalendar とツールバー、各種モーダルを統合します。
 */
import FullCalendar from '@fullcalendar/vue3'
import { ref } from 'vue'

import type { EventType } from '~/composables/portal/useCalendar'
import { useCalendar } from '~/composables/portal/useCalendar'
import { useCalendarEventForm } from '~/composables/portal/useCalendarEventForm'
import { useCalendarOptions } from '~/composables/portal/useCalendarOptions'

import CalendarToolbar from './CalendarToolbar.vue'
import ModalCalendarEvent from './ModalCalendarEvent.vue'
import ModalCalendarTypeSettings from './ModalCalendarTypeSettings.vue'

const props = defineProps<{
  siteId: string
}>()

const {
  events,
  settings,
  createEvent,
  updateEvent,
  deleteEvent,
  updateSettings,
} = useCalendar(props.siteId)

const {
  isModalOpen,
  isEditing,
  form,
  openCreateModal,
  openEditModal,
  saveEvent,
  removeEvent,
} = useCalendarEventForm({
  settings,
  createEvent,
  updateEvent,
  deleteEvent,
})

const {
  fullCalendarRef,
  currentTitle,
  currentView,
  calendarOptions,
  handlePrev,
  handleNext,
  handleToday,
  handleViewChange,
} = useCalendarOptions({
  events,
  settings,
  onSelectDate: (selectInfo) => {
    openCreateModal(selectInfo.startStr, selectInfo.endStr, selectInfo.allDay)
    selectInfo.view.calendar.unselect()
  },
  onEventClick: (clickInfo) => {
    openEditModal(clickInfo.event)
  },
  onEventDrop: async (dropInfo) => {
    try {
      await updateEvent(dropInfo.event.id, {
        start: dropInfo.event.startStr,
        end: dropInfo.event.endStr || undefined,
        allDay: dropInfo.event.allDay,
      })
    }
    catch {
      dropInfo.revert()
    }
  },
  onEventResize: async (resizeInfo) => {
    try {
      await updateEvent(resizeInfo.event.id, {
        start: resizeInfo.event.startStr,
        end: resizeInfo.event.endStr || undefined,
      })
    }
    catch {
      resizeInfo.revert()
    }
  },
})

const isTypeSettingsOpen = ref(false)

const handleSaveEventTypes = async (newTypes: EventType[]) => {
  await updateSettings({ eventTypes: newTypes })
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <CalendarToolbar
      :title="currentTitle"
      :current-view="currentView"
      @prev="handlePrev"
      @next="handleNext"
      @today="handleToday"
      @change-view="handleViewChange"
      @open-type-settings="isTypeSettingsOpen = true"
    />

    <Panel padding="none" overflow="visible" class="calendar-panel">
      <FullCalendar ref="fullCalendarRef" :options="calendarOptions" />
    </Panel>

    <ModalCalendarEvent
      v-model="isModalOpen"
      :is-editing="isEditing"
      :event-types="settings?.eventTypes || []"
      :initial-data="form"
      @save="saveEvent"
      @delete="removeEvent"
    />

    <ModalCalendarTypeSettings
      v-model="isTypeSettingsOpen"
      :event-types="settings?.eventTypes || []"
      @save="handleSaveEventTypes"
    />
  </div>
</template>

<style scoped lang="scss">
/* stylelint-disable property-disallowed-list -- FullCalendarライブラリ動的生成DOMの配置スタイリングのため例外許可 */
.calendar-panel {
  --fc-border-color: var(--color-border);
  --fc-page-bg-color: transparent;
  --fc-neutral-bg-color: transparent;
  --fc-today-bg-color: color-mix(in srgb, var(--theme-accent) 10%, transparent);

  padding: var(--space-2);

  :deep(.fc-theme-standard td),
  :deep(.fc-theme-standard th) {
    border-color: var(--color-border);
  }

  /* 曜日ヘッダー文字 */
  :deep(.fc-col-header-cell-cushion) {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
  }

  :deep(.is-saturday .fc-col-header-cell-cushion) {
    color: var(--color-calendar-saturday);
  }

  :deep(.is-sunday .fc-col-header-cell-cushion) {
    color: var(--color-calendar-sunday);
  }

  /* 日付セル番号 */
  :deep(.fc-daygrid-day) {
    &.is-saturday .fc-daygrid-day-number {
      color: var(--color-calendar-saturday);
    }

    &.is-sunday .fc-daygrid-day-number,
    &.is-holiday .fc-daygrid-day-number {
      color: var(--color-calendar-sunday);
    }

    &.fc-day-today .fc-daygrid-day-number {
      font-family: var(--font-mono);
      font-weight: var(--font-weight-bold);
      color: var(--theme-accent);
    }

    .fc-daygrid-day-number {
      font-size: var(--font-size-xs);
      color: var(--color-text-main);
    }
  }

  /* イベントバッジ（シンプル化） */
  :deep(.fc-daygrid-event) {
    cursor: pointer;

    margin-bottom: var(--space-0-5);
    padding: var(--space-0-5) var(--space-1);
    border: var(--border-width-base) solid var(--fc-event-border-color, var(--theme-accent));
    border-radius: 0;

    background: color-mix(in srgb, var(--fc-event-border-color, var(--theme-accent)) 12%, var(--surface-bg-elevated));

    .fc-event-main {
      overflow: hidden;
      display: flex;
      gap: var(--space-1);
      align-items: center;

      min-width: 0;
    }

    .fc-event-time {
      flex-shrink: 0;

      font-family: var(--font-mono);
      font-size: var(--font-size-2xs);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-muted);
    }

    .fc-event-title {
      overflow: hidden;
      flex: 1;

      min-width: 0;

      font-size: var(--font-size-xs);
      color: var(--color-text-main);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &:hover {
      background: color-mix(in srgb, var(--fc-event-border-color, var(--theme-accent)) 25%, var(--surface-bg-elevated));
    }
  }

  /* 「+○件」展開リンク */
  :deep(.fc-daygrid-more-link) {
    font-size: var(--font-size-2xs);
    font-weight: var(--font-weight-bold);
    color: var(--theme-accent);
  }

  /* ポップオーバー */
  :deep(.fc-popover) {
    z-index: var(--z-index-modal);

    border: var(--border-width-base) solid var(--color-border);
    border-radius: 0;

    background: var(--surface-bg-elevated);
    box-shadow: var(--shadow-modal);

    .fc-popover-header {
      padding: var(--space-1) var(--space-2);
      border-bottom: var(--border-width-base) solid var(--color-border);
      border-radius: 0;

      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      color: var(--theme-accent);

      background: var(--surface-bg);
    }
  }

  /* リスト表示 */
  :deep(.fc-list) {
    border: none;

    .fc-list-day-cushion {
      padding: var(--space-1) var(--space-2);
      color: var(--theme-accent);
      background: var(--color-bg-hover);
    }

    .fc-list-event:hover td {
      background: var(--color-bg-hover);
    }
  }
}
</style>
