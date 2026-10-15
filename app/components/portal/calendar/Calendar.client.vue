<script setup lang="ts">
/**
 * Calendar
 * [Portal Organisms] 現場専用スケジュールカレンダー。
 * FullCalendar とツールバー、各種モーダルを統合します。
 */
import FullCalendar from '@fullcalendar/vue3'
import { computed, ref } from 'vue'

import {
  type CalendarEvent,
  DEFAULT_CALENDAR_EVENT_TYPES,
  type EventType,
} from '#shared/types/calendar'
import { useCalendar } from '~/composables/portal/useCalendar'
import { useCalendarEventForm } from '~/composables/portal/useCalendarEventForm'
import { useCalendarOptions } from '~/composables/portal/useCalendarOptions'
import { useAuth } from '~/composables/useAuth'
import { useToast } from '~/composables/useToast'
import type { SwitchOption } from '~/types/components'
import {
  calculateRemainingWorkingDays,
  formatToDateInputString,
} from '~/utils/date'
import { parseToAppException } from '~/utils/errors'

import ModalCalendarEvent from './ModalCalendarEvent.vue'
import ModalCalendarTypeSettings from './ModalCalendarTypeSettings.vue'

type CalendarView = 'dayGridMonth' | 'listMonth'

const props = defineProps<{
  siteId: string
}>()

const VIEW_SWITCH_OPTIONS: SwitchOption[] = [
  { value: 'dayGridMonth', label: '月表示', icon: 'calendar' },
  { value: 'listMonth', label: 'リスト', icon: 'list' },
]

const toast = useToast()
const { getAccurateNow } = useAuth()

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
  openEditMilestone,
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
  currentYearMonth,
  calendarOptions,
  handlePrev,
  handleNext,
  handleToday,
  handleViewChange,
  gotoDate,
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

const availableEventTypes = computed(() =>
  settings.value?.eventTypes?.length
    ? settings.value.eventTypes
    : DEFAULT_CALENDAR_EVENT_TYPES,
)

const todayStr = computed(() => formatToDateInputString(getAccurateNow()))

const MILESTONE_COLOR = '#f85149'

const milestones = computed(() => {
  const holidayDays = settings.value?.holidayDays ?? [0, 6]
  const customHolidays = settings.value?.customHolidays ?? []

  return events.value
    .filter(e => Boolean(e.isMilestone || e.type === 'milestone'))
    .slice()
    .sort((a, b) => (a.start || '').localeCompare(b.start || ''))
    .map((m) => {
      const dateStr = m.start.split('T')[0] || m.start
      const shortDate = dateStr.length >= 10 ? dateStr.slice(5).replace('-', '/') : dateStr
      const remainingDays = calculateRemainingWorkingDays(
        todayStr.value,
        dateStr,
        holidayDays,
        customHolidays,
      )
      const isPast = dateStr < todayStr.value
      const isToday = dateStr === todayStr.value

      return {
        raw: m,
        id: m.id,
        title: m.title,
        dateStr,
        shortDate,
        yearMonth: dateStr.slice(0, 7),
        color: MILESTONE_COLOR,
        remainingDays,
        isPast,
        isToday,
      }
    })
})

const handleOpenCreateMilestone = () => {
  openCreateModal(todayStr.value, todayStr.value, true, true)
}

const handleMilestoneClick = (item: { raw: CalendarEvent, dateStr: string, yearMonth: string }) => {
  if (currentYearMonth.value && currentYearMonth.value !== item.yearMonth) {
    gotoDate(item.dateStr)
  }
  else {
    openEditMilestone(item.raw)
  }
}

const onViewChange = (val: string | number) => {
  handleViewChange(val as CalendarView)
}

const isTypeSettingsOpen = ref(false)

const handleSaveEventTypes = async (newTypes: EventType[]) => {
  try {
    await updateSettings({ eventTypes: newTypes })
    toast.success('予定種別の設定を保存しました。')
  }
  catch (e: unknown) {
    toast.error(parseToAppException(e).getUserFacingMessage())
  }
}

const getCustomHolidayLabel = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const iso = `${y}-${m}-${d}`

  if (!settings.value?.customHolidays?.includes(iso)) return ''

  return settings.value?.customHolidayLabels?.[iso] || '休工'
}
</script>

<template>
  <div class="flex flex-col gap-panel-gap">
    <header class="calendar-toolbar flex flex-col md:flex-row items-center justify-between gap-item-gap px-panel-pad py-item-gap">
      <div class="flex items-center gap-inline-gap">
        <Button size="sm" icon="chevron-left" @click="handlePrev" />
        <Button size="sm" icon="chevron-right" @click="handleNext" />
        <Button size="sm" @click="handleToday">今日へ移動</Button>
      </div>

      <h3 class="toolbar-title order-first md:order-none">
        {{ currentTitle }}
      </h3>

      <div class="flex items-center gap-item-gap">
        <Switch :model-value="currentView" :options="VIEW_SWITCH_OPTIONS" size="sm" @change="onViewChange" />

        <Button size="sm" icon="settings" @click="isTypeSettingsOpen = true">種別設定を開く</Button>
      </div>
    </header>

    <!-- マイルストーン・カウントダウン帯 -->
    <div class="panel is-sunken p-panel-pad-compact flex flex-wrap items-center justify-between gap-item-gap">
      <div class="flex flex-wrap items-center gap-item-gap min-w-0 flex-1">
        <span class="label shrink-0">
          <Icon name="target" size="sm" />
          <span>マイルストーン</span>
        </span>

        <ul v-if="milestones.length > 0" class="flex flex-wrap items-center gap-inline-gap min-w-0">
          <li v-for="m in milestones" :key="m.id">
            <button
              type="button"
              class="panel is-elevated is-interactive px-item-gap py-inline-gap flex items-center gap-inline-gap milestone-chip"
              :class="{ 'is-past-milestone': m.isPast }"
              :style="{ borderLeft: `3px solid ${m.color}` }"
              title="クリックで該当月へジャンプ（該当月表示中は編集モーダルを開きます）"
              @click="handleMilestoneClick(m)"
            >
              <time>{{ m.shortDate }}</time>
              <strong class="truncate max-w-[160px]">{{ m.title }}</strong>
              <template v-if="!m.isPast">
                <Badge v-if="m.isToday" variant="red" size="sm">本日</Badge>
                <Badge v-else variant="red" size="sm">
                  あと {{ m.remainingDays }}日
                </Badge>
              </template>
            </button>
          </li>
        </ul>

        <small v-else>重要な工程期日（受電日・検査日など）を登録すると、残り稼働日数がここに表示されます。</small>
      </div>

      <Button size="sm" variant="secondary" icon="plus" class="shrink-0" @click="handleOpenCreateMilestone">
        マイルストーン追加
      </Button>
    </div>

    <div class="panel p-panel-pad-compact calendar-panel">
      <FullCalendar ref="fullCalendarRef" :options="calendarOptions">
        <template #day-cell-content="arg">
          <Badge v-if="getCustomHolidayLabel(arg.date)" variant="amber" size="sm">
            {{ getCustomHolidayLabel(arg.date) }}
          </Badge>
          <span class="ml-auto">{{ arg.dayNumberText }}</span>
        </template>
      </FullCalendar>
    </div>

    <ModalCalendarEvent v-model="isModalOpen" :is-editing="isEditing" :event-types="availableEventTypes" :initial-data="form" @save="saveEvent" @delete="removeEvent" />

    <ModalCalendarTypeSettings v-model="isTypeSettingsOpen" :event-types="availableEventTypes" @save="handleSaveEventTypes" />
  </div>
</template>

<style scoped lang="scss">
/* stylelint-disable property-disallowed-list -- FullCalendarライブラリ動的生成DOMの配置スタイリングのため例外許可 */
.milestone-chip {
  &.is-past-milestone {
    opacity: 0.45;
  }
}

.calendar-panel {
  --fc-border-color: var(--color-border);
  --fc-page-bg-color: transparent;
  --fc-neutral-bg-color: transparent;
  --fc-today-bg-color: color-mix(in srgb, var(--theme-accent) 10%, transparent);

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
    .fc-daygrid-day-top {
      flex-direction: row;
    }

    .fc-daygrid-day-number {
      display: flex;
      gap: var(--space-1);
      align-items: center;
      justify-content: space-between;

      width: 100%;

      font-size: var(--font-size-xs);
      color: var(--color-text-main);
    }

    &.is-saturday {
      background-color: color-mix(in srgb, var(--color-calendar-saturday) 4%, var(--surface-bg-sunken));

      .fc-daygrid-day-number {
        color: var(--color-calendar-saturday);
      }
    }

    &.is-sunday,
    &.is-holiday {
      background-color: color-mix(in srgb, var(--color-calendar-sunday) 5%, var(--surface-bg-sunken));

      .fc-daygrid-day-number {
        color: var(--color-calendar-sunday);
      }
    }

    &.is-custom-holiday {
      background-color: color-mix(in srgb, var(--color-calendar-custom-holiday) 8%, var(--surface-bg-sunken));

      .fc-daygrid-day-number {
        font-weight: var(--font-weight-bold);
        color: var(--color-calendar-custom-holiday);
      }
    }

    &.fc-day-today .fc-daygrid-day-number {
      font-family: var(--font-mono);
      font-weight: var(--font-weight-bold);
      color: var(--theme-accent);
    }

    &.fc-day-today.is-custom-holiday .fc-daygrid-day-number {
      color: var(--color-calendar-custom-holiday);
    }
  }

  /* イベントバッジ（シンプル化） */
  :deep(.fc-daygrid-event) {
    margin-bottom: var(--space-0-5);
    padding: var(--space-0-5) var(--space-1);
    border: var(--border-width-base) solid var(--fc-event-border-color, var(--theme-accent));
    border-radius: 0;

    background: color-mix(in srgb, var(--fc-event-border-color, var(--theme-accent)) 12%, var(--surface-bg-elevated));

    @include state-interactive;

    &.is-milestone {
      border-left-width: 3px;
      background: color-mix(in srgb, var(--fc-event-border-color, var(--theme-accent)) 22%, var(--surface-bg-elevated));

      .fc-event-title {
        font-weight: var(--font-weight-bold);

        &::before {
          content: "⚑ ";
        }
      }
    }

    &.is-past-milestone {
      opacity: 0.45;
    }

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

.calendar-toolbar {
  border: var(--border-width-base) solid color-mix(in srgb, var(--color-border) 30%, transparent);
  background-color: var(--surface-bg);
}

.toolbar-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--theme-accent);
}
</style>
