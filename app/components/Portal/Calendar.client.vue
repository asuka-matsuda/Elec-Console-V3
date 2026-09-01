<script setup lang="ts">
import type {
  CalendarOptions,
  DateSelectArg,
  DayCellContentArg,
  EventClickArg,
  EventDropArg,
} from '@fullcalendar/core'
import jaLocale from '@fullcalendar/core/locales/ja'
import dayGridPlugin from '@fullcalendar/daygrid'
import type { EventResizeDoneArg } from '@fullcalendar/interaction'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import FullCalendar from '@fullcalendar/vue3'
import { computed, ref } from 'vue'

import type { EventType } from '~/composables/portal/useCalendar'
import { useCalendar } from '~/composables/portal/useCalendar'

import CalendarEventBadge from './CalendarEventBadge.vue'
import CalendarEventModal from './CalendarEventModal.vue'
import CalendarToolbar from './CalendarToolbar.vue'
import CalendarTypeSettingsModal from './CalendarTypeSettingsModal.vue'

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

// ====================
// Event Modal Logic
// ====================
const isModalOpen = ref(false)
const isEditing = ref(false)
const editingEventId = ref<string | null>(null)

const form = ref({
  title: '',
  type: 'work',
  start: '',
  end: '',
  allDay: false,
})

const openCreateModal = (startStr: string, endStr: string, allDay: boolean) => {
  isEditing.value = false
  editingEventId.value = null

  const finalStart = startStr
  let finalEnd = endStr

  if (allDay && endStr) {
    const d = new Date(endStr)

    d.setDate(d.getDate() - 1)
    finalEnd = d.toISOString().split('T')[0] || ''
  }

  form.value = {
    title: '',
    type: settings.value?.eventTypes?.[0]?.id || 'work',
    start: finalStart,
    end: finalEnd || finalStart,
    allDay,
  }
  isModalOpen.value = true
}

const openEditModal = (calEvent: {
  id: string
  title: string
  startStr: string
  endStr: string
  allDay: boolean
  extendedProps: { type?: string }
}) => {
  isEditing.value = true
  editingEventId.value = calEvent.id

  const finalStart = calEvent.startStr
  let finalEnd = calEvent.endStr

  if (calEvent.allDay && calEvent.endStr) {
    const d = new Date(calEvent.endStr)

    d.setDate(d.getDate() - 1)
    finalEnd = d.toISOString().split('T')[0] || ''
  }

  form.value = {
    title: calEvent.title,
    type: calEvent.extendedProps.type || 'work',
    start: finalStart,
    end: finalEnd || finalStart,
    allDay: calEvent.allDay,
  }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const saveEvent = async (savedData: typeof form.value) => {
  let finalEnd: string | undefined = savedData.end

  if (savedData.allDay && savedData.start && savedData.end) {
    if (savedData.start === savedData.end) {
      finalEnd = undefined
    }
    else {
      const endDate = new Date(savedData.end)

      endDate.setDate(endDate.getDate() + 1)
      finalEnd = endDate.toISOString().split('T')[0]
    }
  }

  try {
    if (isEditing.value && editingEventId.value) {
      await updateEvent(editingEventId.value, {
        title: savedData.title,
        type: savedData.type,
        start: savedData.start,
        end: finalEnd,
        allDay: savedData.allDay,
      })
    }
    else {
      await createEvent({
        title: savedData.title,
        type: savedData.type,
        start: savedData.start,
        end: finalEnd,
        allDay: savedData.allDay,
      })
    }
  }
  finally {
    isModalOpen.value = false
  }
}

const isTypeSettingsOpen = ref(false)

const handleSaveEventTypes = async (newTypes: EventType[]) => {
  await updateSettings({ eventTypes: newTypes })
  events.value = [...events.value]
}

const {
  isOpen: isConfirmOpen,
  title: confirmTitle,
  message: confirmMessage,
  confirmText: confirmBtnText,
  intent: confirmIntent,
  askConfirm,
  handleConfirm,
} = useConfirmModal()

const removeEvent = () => {
  if (!editingEventId.value) return
  const targetId = editingEventId.value

  askConfirm({
    title: '予定の削除',
    message: `「${form.value.title || 'この予定'}」を削除してもよろしいですか？`,
    confirmText: '削除する',
    intent: 'danger',
    onConfirm: async () => {
      await deleteEvent(targetId)
      closeModal()
    },
  })
}

// ====================
// Calendar Config & Options
// ====================
const fullCalendarRef = ref<InstanceType<typeof FullCalendar> | null>(null)
const currentTitle = ref('')
const currentView = ref<'dayGridMonth' | 'listMonth'>('dayGridMonth')

const handlePrev = () => fullCalendarRef.value?.getApi().prev()
const handleNext = () => fullCalendarRef.value?.getApi().next()
const handleToday = () => fullCalendarRef.value?.getApi().today()
const handleViewChange = (view: 'dayGridMonth' | 'listMonth') => {
  currentView.value = view
  fullCalendarRef.value?.getApi().changeView(view)
}

const formattedEvents = computed(() => {
  return events.value.map((evt) => {
    const typeDef = settings.value?.eventTypes?.find(t => t.id === evt.type)
    const color = typeDef?.color || '#00f0ff'

    return {
      ...evt,
      borderColor: color,
      backgroundColor: 'transparent',
      textColor: 'inherit',
      extendedProps: {

        type: evt.type,
        themeColor: color,
      },
    }
  })
})

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, interactionPlugin, listPlugin],
  initialView: 'dayGridMonth',
  locale: jaLocale,
  events: formattedEvents.value,
  editable: true,
  selectable: true,
  headerToolbar: false,
  dayMaxEvents: 3,
  moreLinkClick: 'popover' as const,
  moreLinkContent: (args: { num: number }) => `+${args.num}件`,
  datesSet: (arg: { view: { title: string, type: string } }) => {
    currentTitle.value = arg.view.title
    currentView.value = arg.view.type as 'dayGridMonth' | 'listMonth'
  },
  height: 'auto',
  dayHeaderClassNames: (arg: { date: Date }) => {
    const classes = []

    if (arg.date.getDay() === 0) classes.push('is-sunday')
    if (arg.date.getDay() === 6) classes.push('is-saturday')

    return classes
  },
  dayCellClassNames: (arg: DayCellContentArg) => {
    const classes = []
    const isoDate
      = arg.date.getFullYear()
        + '-'
        + String(arg.date.getMonth() + 1).padStart(2, '0')
        + '-'
        + String(arg.date.getDate()).padStart(2, '0')

    if (arg.date.getDay() === 0) classes.push('is-sunday')
    if (arg.date.getDay() === 6) classes.push('is-saturday')
    if (settings.value?.customHolidays?.includes(isoDate)) classes.push('is-holiday')

    return classes
  },

  select: (selectInfo: DateSelectArg) => {
    openCreateModal(selectInfo.startStr, selectInfo.endStr, selectInfo.allDay)
    selectInfo.view.calendar.unselect()
  },
  eventClick: (clickInfo: EventClickArg) => {
    openEditModal(clickInfo.event)
  },
  eventDrop: async (dropInfo: EventDropArg) => {
    await updateEvent(dropInfo.event.id, {
      start: dropInfo.event.startStr,
      end: dropInfo.event.endStr || undefined,
      allDay: dropInfo.event.allDay,
    })
  },
  eventResize: async (resizeInfo: EventResizeDoneArg) => {
    await updateEvent(resizeInfo.event.id, {
      start: resizeInfo.event.startStr,
      end: resizeInfo.event.endStr || undefined,
    })
  },
}))

const typedCalendarOptions = computed(() => calendarOptions.value as CalendarOptions)
</script>

<template>
  <div class="c-calendar-wrapper">
    <CalendarToolbar
      :title="currentTitle"
      :current-view="currentView"
      @prev="handlePrev"
      @next="handleNext"
      @today="handleToday"
      @change-view="handleViewChange"
      @open-type-settings="isTypeSettingsOpen = true"
    />

    <AppPanel
      class="c-calendar"
      variant="simple"
    >
      <FullCalendar
        ref="fullCalendarRef"
        :options="typedCalendarOptions"
      >
        <template #eventContent="{ event }">
          <CalendarEventBadge
            :title="event.title"
            :all-day="event.allDay"
            :start="event.start"
            :end="event.end"
            :color="event.extendedProps?.themeColor"
          />
        </template>
      </FullCalendar>
    </AppPanel>

    <!-- Event Modal -->
    <CalendarEventModal
      v-model="isModalOpen"
      :is-editing="isEditing"
      :event-types="settings?.eventTypes || []"
      :initial-data="form"
      @save="saveEvent"
      @delete="removeEvent"
    />

    <!-- Type Settings Modal -->
    <CalendarTypeSettingsModal
      v-model="isTypeSettingsOpen"
      :event-types="settings?.eventTypes || []"
      @save="handleSaveEventTypes"
    />

    <!-- Confirm Modal -->
    <AppConfirmModal
      v-model="isConfirmOpen"
      :title="confirmTitle"
      :message="confirmMessage"
      :confirm-text="confirmBtnText"
      :intent="confirmIntent"
      @confirm="handleConfirm"
    />
  </div>
</template>

<style scoped lang="scss">
.c-calendar-wrapper {
  @include flex-start-stretch($direction: column);

  gap: var(--space-3);
}

.c-calendar {
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
        @include text-mono("sm", "bold");

        color: var(--color-primary);
      }
    }

    .fc-daygrid-day-number {
      color: var(--color-text-main);
    }

    /* セル本体：変数ベースで基本背景＆ホバー枠線・発光を一元計算 */
    .fc-daygrid-day-frame {
      @include state-base(none, var(--transition-base), var(--cell-accent-color));

      /* 平日・土曜・日曜祝日・今日すべてで統一のホバー発光を適用 */
      &:hover:not(:has(.fc-daygrid-event:hover)) {
        @include state-hover(var(--cell-accent-color));
      }
    }
  }

  /* ==== イベントスタイル（FullCalendar ラッパーのクリーン化） ==== */
  :deep(.fc-daygrid-event) {
    @include click-enabled;

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
      .c-cal-badge {
        @include state-hover(var(--badge-color));
      }
    }
  }

  /* 3件超過時の「+○件」展開リンク */
  :deep(.fc-daygrid-more-link) {
    @include text-meta("md", "bold");

    display: inline-block;
    padding: var(--space-0-5) var(--space-1);
    border-bottom: 1px dashed var(--color-primary);
    color: var(--color-primary);

    @include state-base;
    @include cyber-text-glow(var(--color-primary), 50%, var(--blur-sm));

    &:hover {
      transform: translateY(-1px);

      @include cyber-text-glow(var(--color-primary), 100%, var(--blur-md));
    }
  }

  /* ポップオーバーのサイバースタイル（すりガラス、角丸厳禁、発光枠線） */
  :deep(.fc-popover) {
    z-index: var(--z-index-modal);
    border-radius: 0;
    background-color: color-mix(in srgb, var(--color-surface) 85%, transparent);
    backdrop-filter: blur(var(--blur-md));

    @include border-base;
    @include shadow("modal");

    .fc-popover-header {
      @include flex-between-center;

      padding: var(--space-1) var(--space-3);
      border-top: none;
      border-right: none;
      border-left: none;
      border-radius: 0;

      background-color: color-mix(in srgb, var(--color-surface-sunken) 85%, transparent);

      @include border-base($opacity: 30%);

      .fc-popover-title {
        @include text-desc("md", "bold");

        color: var(--color-primary);
      }

      .fc-popover-close {
        @include click-enabled;

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
      @include text-desc("md", "bold");

      color: var(--theme-accent);
    }

    .fc-list-event {
      @include click-enabled;
      @include state-base;

      &:hover td {
        background-color: color-mix(in srgb, var(--theme-accent) 15%, transparent);
      }

      td {
        border-color: var(--color-border);
      }
    }

    .fc-list-event-title,
    .fc-list-event-time {
      @include text-desc;

      color: var(--color-text-main);
    }

    .fc-list-event-dot {
      border-color: var(--event-color, var(--color-primary));

      @include state-focus(var(--event-color, var(--color-primary)));
    }

    .fc-list-empty {
      @include text-body;

      padding: var(--space-card-pad);
      color: var(--color-text-muted);
      text-align: center;
    }
  }
}
</style>
