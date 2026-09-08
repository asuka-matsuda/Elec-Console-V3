<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3'
import { ref } from 'vue'

import type { EventType } from '~/composables/portal/useCalendar'
import { useCalendar } from '~/composables/portal/useCalendar'
import { useCalendarEventForm } from '~/composables/portal/useCalendarEventForm'
import { useCalendarOptions } from '~/composables/portal/useCalendarOptions'

import PortalCalEventBadge from './PortalCalEventBadge.vue'
import PortalCalEventModal from './PortalCalEventModal.vue'
import PortalCalToolbar from './PortalCalToolbar.vue'
import PortalCalTypeSettingsModal from './PortalCalTypeSettingsModal.vue'

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
    await updateEvent(dropInfo.event.id, {
      start: dropInfo.event.startStr,
      end: dropInfo.event.endStr || undefined,
      allDay: dropInfo.event.allDay,
    })
  },
  onEventResize: async (resizeInfo) => {
    await updateEvent(resizeInfo.event.id, {
      start: resizeInfo.event.startStr,
      end: resizeInfo.event.endStr || undefined,
    })
  },
})

const isTypeSettingsOpen = ref(false)

const handleSaveEventTypes = async (newTypes: EventType[]) => {
  await updateSettings({ eventTypes: newTypes })
  events.value = [...events.value]
}
</script>

<template>
  <div class="calendar-wrapper">
    <PortalCalToolbar
      :title="currentTitle"
      :current-view="currentView"
      @prev="handlePrev"
      @next="handleNext"
      @today="handleToday"
      @change-view="handleViewChange"
      @open-type-settings="isTypeSettingsOpen = true"
    />

    <AtomsPanel class="calendar">
      <FullCalendar ref="fullCalendarRef" :options="calendarOptions">
        <template #eventContent="{ event }">
          <PortalCalEventBadge
            :title="event.title"
            :all-day="event.allDay"
            :start="event.start"
            :end="event.end"
            :color="event.extendedProps?.themeColor"
          />
        </template>
      </FullCalendar>
    </AtomsPanel>

    <PortalCalEventModal
      v-model="isModalOpen"
      :is-editing="isEditing"
      :event-types="settings?.eventTypes || []"
      :initial-data="form"
      @save="saveEvent"
      @delete="removeEvent"
    />

    <PortalCalTypeSettingsModal
      v-model="isTypeSettingsOpen"
      :event-types="settings?.eventTypes || []"
      @save="handleSaveEventTypes"
    />
  </div>
</template>

<style scoped lang="scss">
.calendar-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.calendar {
  --fc-border-color: var(--color-border);
  --fc-page-bg-color: transparent;
  --fc-neutral-bg-color: transparent;
  --fc-event-bg-color: transparent;
  --fc-event-border-color: transparent;
  --fc-event-text-color: var(--color-text-main);
  --fc-event-selected-overlay-color: transparent;

  min-height: 500px;

  @include mq("md") {
    min-height: 400px;
  }

  :deep(.fc-theme-standard td),
  :deep(.fc-theme-standard th) {
    border-color: var(--color-border);
  }

  /* 曜日ヘッダー文字 */
  :deep(.fc-col-header-cell-cushion) {
    color: var(--color-text-main);
  }

  /* ==== セルと曜日のCSS変数一元管理アーキテクチャ ==== */
  :deep(.fc-daygrid-day) {
    --cell-accent-color: var(--color-primary);
    --cell-accent-opacity: 0%;

    &.is-saturday {
      --cell-accent-color: var(--color-category-database);
      --cell-accent-opacity: 15%;

      .fc-daygrid-day-number {
        color: var(--color-category-database);
      }
    }

    &.is-sunday,
    &.is-holiday {
      --cell-accent-color: var(--color-status-danger);
      --cell-accent-opacity: 20%;

      .fc-daygrid-day-number {
        color: var(--color-status-danger);
      }
    }

    &.fc-day-today {
      --cell-accent-color: var(--color-primary);
      --cell-accent-opacity: 20%;

      .fc-daygrid-day-number {
        font-family: var(--font-mono);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-bold);
        font-variant-numeric: tabular-nums;
        color: var(--color-primary);
      }
    }

    .fc-daygrid-day-number {
      color: var(--color-text-main);
    }

    /* セル本体：変数ベースで基本背景＆ホバー枠線・発光を一元計算 */
    .fc-daygrid-day-frame {
      position: relative;
      z-index: 1;
      transition: var(--transition-base);

      /* 平日・土曜・日曜祝日・今日すべてで統一のホバー発光を適用 */
      &:hover:not(:has(.fc-daygrid-event:hover)) {
        --glow-color: var(--cell-accent-color);

        border-color: var(--glow-color);
        box-shadow: var(--shadow-glow-hover);
        transition: var(--transition-glow);
      }
    }
  }

  /* ==== イベントスタイル（FullCalendar ラッパーのクリーン化） ==== */
  :deep(.fc-daygrid-event) {
    cursor: pointer;
    user-select: none;

    z-index: 1;

    overflow: visible;

    margin-bottom: var(--space-0-5);
    padding: 0;
    border: none;
    border-radius: 0;

    background: transparent;

    &:hover {
      z-index: 100; // カレンダー上で最前面に持ってくる
      border: none;
      background: transparent;

      // 子要素のバッジのホバースタイルを親から強制的に発火させる
      .cal-badge {
        --glow-color: var(--badge-color);

        border-color: var(--glow-color);
        box-shadow: var(--shadow-glow-hover);
        transition: var(--transition-glow);
      }
    }
  }

  /* 3件超過時の「+○件」展開リンク */
  :deep(.fc-daygrid-more-link) {
    --glow-color: var(--color-primary);

    position: relative;
    z-index: 1;

    display: inline-block;

    padding: var(--space-0-5) var(--space-1);
    border-bottom: 1px dashed var(--color-primary);

    font-size: var(--font-size-2xs);
    font-weight: var(--font-weight-bold);
    color: var(--color-primary);
    text-shadow: var(--text-glow-sm);

    transition: var(--transition-base);

    &:hover {
      transform: translateY(-1px);
      text-shadow: var(--text-glow-md);
    }
  }

  /* ポップオーバーのサイバースタイル（すりガラス、角丸厳禁、発光枠線） */
  :deep(.fc-popover) {
    z-index: var(--z-index-modal);

    border: var(--border-width-base) solid var(--color-border);
    border-radius: var(--radius-sm);

    background-color: color-mix(in srgb, var(--color-surface) 85%, transparent);
    backdrop-filter: blur(var(--blur-md));
    box-shadow: var(--shadow-modal);

    .fc-popover-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      padding: var(--space-1) var(--space-3);
      border: var(--border-width-base) solid color-mix(in srgb, var(--color-border) 30%, transparent);
      border-top: none;
      border-right: none;
      border-left: none;
      border-radius: var(--radius-sm);

      background-color: color-mix(
        in srgb,
        var(--color-surface-sunken) 85%,
        transparent
      );

      .fc-popover-title {
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-bold);
        color: var(--color-primary);
      }

      .fc-popover-close {
        cursor: pointer;
        user-select: none;
        color: var(--color-text-muted);
        opacity: 0.8;

        &:hover {
          color: var(--color-text-main);
          opacity: 1;
        }
      }
    }

    .fc-popover-body {
      padding: var(--space-2);
    }
  }

  /* リストビューの装飾 */
  :deep(.fc-list) {
    border: none;

    .fc-list-day-cushion {
      padding: var(--space-1) var(--space-3);
      background-color: var(--color-bg-hover);
    }

    .fc-list-day-text,
    .fc-list-day-side-text {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-bold);
      color: var(--theme-accent);
    }

    .fc-list-event {
      cursor: pointer;
      user-select: none;

      position: relative;
      z-index: 1;

      transition: var(--transition-base);

      &:hover td {
        background-color: color-mix(
          in srgb,
          var(--theme-accent) 15%,
          transparent
        );
      }

      td {
        border-color: var(--color-border);
      }
    }

    .fc-list-event-title,
    .fc-list-event-time {
      font-size: var(--font-size-sm);
      color: var(--color-text-main);
    }

    .fc-list-event-dot {
      --glow-color: var(--event-color, var(--color-primary));

      border-color: color-mix(in srgb, var(--glow-color) 60%, transparent);
      outline: none;
      box-shadow: var(--shadow-glow-focus);
      transition: var(--transition-glow);
    }

    .fc-list-empty {
      padding: var(--space-card-pad);
      font-size: var(--font-size-base);
      color: var(--color-text-muted);
      text-align: center;
    }
  }
}
</style>
