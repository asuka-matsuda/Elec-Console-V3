<script setup lang="ts">
/**
 * Calendar
 * [Portal Organisms] 現場専用スケジュールカレンダー。
 * FullCalendar（月表示・24時間週タイムライン・リスト表示）とツールバー、フィルタ、各種モーダルを統合します。
 */
import FullCalendar from '@fullcalendar/vue3'
import { computed, onMounted, onUnmounted, ref } from 'vue'

import {
  DEFAULT_CALENDAR_EVENT_TYPES,
  type EventType,
} from '#shared/types/calendar'
import { getUserDisplayName } from '#shared/utils/user'
import { useCalendar } from '~/composables/portal/useCalendar'
import { useCalendarEventForm } from '~/composables/portal/useCalendarEventForm'
import { type CalendarViewType, useCalendarOptions } from '~/composables/portal/useCalendarOptions'
import { useCurrentSite } from '~/composables/portal/useCurrentSite'
import { useAuth } from '~/composables/useAuth'
import { useToast } from '~/composables/useToast'
import type { SwitchOption } from '~/types/components'
import { formatToDateInputString } from '~/utils/date'
import { parseToAppException } from '~/utils/errors'

import ModalCalendarEvent from './ModalCalendarEvent.vue'
import ModalCalendarTypeSettings from './ModalCalendarTypeSettings.vue'

const props = defineProps<{
  siteId: string
}>()

const VIEW_SWITCH_OPTIONS: SwitchOption[] = [
  { value: 'dayGridMonth', label: '月表示', icon: 'calendar' },
  { value: 'timeGridWeek', label: '週表示', icon: 'clock' },
  { value: 'listMonth', label: 'リスト', icon: 'list' },
]

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const
const MILESTONE_COLOR = '#f85149'

const toast = useToast()
const { currentUser, getAccurateNow } = useAuth()
const { site: currentSite } = useCurrentSite(() => props.siteId)

// 閲覧専用ロール（viewer）の判定
const isReadonly = computed(() => {
  if (!currentUser.value) return false
  if (currentUser.value.loginId === 'master') return false
  const assignment = currentUser.value.siteAssignments?.find(sa => sa.siteId === props.siteId)
  const role = assignment?.role || currentUser.value.role

  return role === 'viewer'
})

// 現場にアサインされているメンバー名一覧（担当者選択用）
const siteMembers = computed<string[]>(() => {
  const names = new Set<string>()

  if (currentSite.value?.users) {
    for (const u of currentSite.value.users) {
      if (u.isActive !== false) {
        const displayName = getUserDisplayName(u, '').trim()

        if (displayName) names.add(displayName)
      }
    }
  }
  if (currentSite.value?.workers) {
    for (const w of currentSite.value.workers) {
      if (w && w.trim()) names.add(w.trim())
    }
  }

  return Array.from(names)
})

const showSharedEvents = ref(true)
const showPersonalEvents = ref(true)
const selectedTypes = ref<string[]>([])

const isTypeSelected = (typeId: string): boolean => {
  return selectedTypes.value.includes(typeId)
}

const toggleTypeFilter = (typeId: string) => {
  const idx = selectedTypes.value.indexOf(typeId)

  if (idx === -1) {
    selectedTypes.value = [...selectedTypes.value, typeId]
  }
  else {
    selectedTypes.value = selectedTypes.value.filter(id => id !== typeId)
  }
}

const clearTypeFilter = () => {
  selectedTypes.value = []
}

// 閲覧専用ロール時、または「個人の予定」のみにチェックが入っている時は新規作成の初期値を「個人予定」にする
const shouldDefaultToPersonal = computed(() =>
  isReadonly.value || (!showSharedEvents.value && showPersonalEvents.value),
)

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
  duplicateEvent,
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
  selectedTypes,
  showSharedEvents,
  showPersonalEvents,
  readonly: isReadonly,
  onSelectDate: (selectInfo) => {
    openCreateModal(
      selectInfo.startStr,
      selectInfo.endStr,
      selectInfo.allDay,
      false,
      shouldDefaultToPersonal.value,
    )
    selectInfo.view.calendar.unselect()
  },
  onEventClick: (clickInfo) => {
    openEditModal(clickInfo.event)
  },
  onEventDrop: async (dropInfo) => {
    if (isReadonly.value && !dropInfo.event.extendedProps?.isPersonal) {
      dropInfo.revert()

      return
    }
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
    if (isReadonly.value && !resizeInfo.event.extendedProps?.isPersonal) {
      resizeInfo.revert()

      return
    }
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

// 年月ダイレクトジャンプピッカー制御
const isYearMonthPickerOpen = ref(false)
const pickerYear = ref(getAccurateNow().getFullYear())

const activeMonthNumber = computed(() => {
  if (!currentYearMonth.value) return getAccurateNow().getMonth() + 1
  const parts = currentYearMonth.value.split('-')

  return Number(parts[1]) || (getAccurateNow().getMonth() + 1)
})

const toggleYearMonthPicker = () => {
  if (!isYearMonthPickerOpen.value && currentYearMonth?.value) {
    const y = Number(currentYearMonth.value.split('-')[0])

    if (y) pickerYear.value = y
  }
  isYearMonthPickerOpen.value = !isYearMonthPickerOpen.value
}

const handleSelectYearMonth = (month: number) => {
  const mStr = String(month).padStart(2, '0')

  gotoDate(`${pickerYear.value}-${mStr}-01`)
  isYearMonthPickerOpen.value = false
}

const handleOpenCreateEvent = () => {
  openCreateModal(todayStr.value, todayStr.value, true, false, shouldDefaultToPersonal.value)
}

const onViewChange = (val: string | number) => {
  handleViewChange(val as CalendarViewType)
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

// キーボードショートカット（T: 今日 / M: 月 / W: 週 / L: リスト / C: 新規予定）
const handleKeydown = (e: KeyboardEvent) => {
  if (isModalOpen.value || isTypeSettingsOpen.value) return
  if (e.ctrlKey || e.metaKey || e.altKey) return

  const target = e.target as HTMLElement | null

  if (
    target
    && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)
  ) {
    return
  }

  const key = e.key.toLowerCase()

  if (key === 't') {
    e.preventDefault()
    handleToday()
  }
  else if (key === 'm') {
    e.preventDefault()
    handleViewChange('dayGridMonth')
  }
  else if (key === 'w') {
    e.preventDefault()
    handleViewChange('timeGridWeek')
  }
  else if (key === 'l') {
    e.preventDefault()
    handleViewChange('listMonth')
  }
  else if (key === 'c' || key === 'n') {
    e.preventDefault()
    handleOpenCreateEvent()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="flex flex-col gap-panel-gap">
    <header class="calendar-toolbar flex flex-col gap-item-gap px-panel-pad py-2">
      <div class="flex flex-col md:flex-row items-center justify-between gap-item-gap">
        <div class="flex items-center gap-inline-gap">
          <Button size="sm" icon="chevron-left" title="前へ" @click="handlePrev" />
          <Button size="sm" icon="chevron-right" title="次へ" @click="handleNext" />
          <Button size="sm" title="今日へ移動 (ショートカット: T)" @click="handleToday">今日へ移動</Button>
        </div>

        <button
          type="button"
          class="panel is-interactive p-panel-pad-compact flex items-center gap-inline-gap order-first md:order-none"
          title="クリックして年月を直接指定"
          @click="toggleYearMonthPicker"
        >
          <h3 class="toolbar-title">
            {{ currentTitle }}
          </h3>
          <Icon :name="isYearMonthPickerOpen ? 'chevron-up' : 'chevron-down'" size="sm" />
        </button>

        <div class="flex flex-wrap items-center justify-end gap-item-gap">
          <Switch :model-value="currentView" :options="VIEW_SWITCH_OPTIONS" size="sm" @change="onViewChange" />

          <Button v-if="!isReadonly" size="sm" icon="settings" @click="isTypeSettingsOpen = true">種別設定を開く</Button>

          <Button variant="primary" size="sm" icon="plus" title="新しい予定を追加 (ショートカット: C)" @click="handleOpenCreateEvent">
            予定を追加
          </Button>
        </div>
      </div>

      <!-- 年月ダイレクトジャンプパネル -->
      <div v-if="isYearMonthPickerOpen" class="panel is-sunken p-panel-pad-compact flex flex-col gap-inline-gap">
        <div class="flex items-center justify-between gap-item-gap">
          <small>移動先の年月を選択</small>
          <div class="flex items-center gap-inline-gap">
            <Button size="sm" icon="chevron-left" @click="pickerYear--" />
            <code>{{ pickerYear }}年</code>
            <Button size="sm" icon="chevron-right" @click="pickerYear++" />
          </div>
        </div>
        <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-micro-gap">
          <button
            v-for="m in MONTHS"
            :key="m"
            type="button"
            class="panel is-interactive p-panel-pad-compact text-center"
            :class="{ 'is-active': activeMonthNumber === m }"
            @click="handleSelectYearMonth(m)"
          >
            <small>{{ m }}月</small>
          </button>
        </div>
      </div>

      <!-- 予定表レイヤー（共有・個人）および種別マルチセレクト絞り込みバー -->
      <div class="flex flex-col gap-inline-gap pt-1 filter-bar">
        <div class="flex flex-wrap items-center gap-item-gap">
          <small class="flex items-center gap-micro-gap shrink-0">
            <Icon name="calendar" size="sm" />
            <span>予定表:</span>
          </small>
          <ul class="flex flex-wrap items-center gap-item-gap">
            <li>
              <Checkbox v-model="showSharedEvents" label="共有の予定（現場）" />
            </li>
            <li>
              <Checkbox v-model="showPersonalEvents" label="個人の予定（マイ予定）" />
            </li>
          </ul>
        </div>

        <div class="flex items-start gap-inline-gap">
          <small class="flex items-center gap-micro-gap shrink-0 py-0.5">
            <Icon name="filter" size="sm" />
            <span>種別（複数選択可）:</span>
          </small>
          <ul class="flex flex-wrap items-center gap-micro-gap flex-1">
            <li>
              <button
                type="button"
                class="panel is-interactive p-panel-pad-compact flex items-center gap-micro-gap"
                :class="{ 'is-active': selectedTypes.length === 0 }"
                @click="clearTypeFilter"
              >
                <small>すべて</small>
              </button>
            </li>
            <li>
              <button
                type="button"
                class="panel is-interactive p-panel-pad-compact flex items-center gap-micro-gap"
                :class="{ 'is-active': isTypeSelected('milestone') }"
                :style="{ '--theme-accent': MILESTONE_COLOR, '--glow-color': MILESTONE_COLOR }"
                @click="toggleTypeFilter('milestone')"
              >
                <span class="w-2 h-2 shrink-0" :style="{ backgroundColor: MILESTONE_COLOR }" />
                <small>マイルストーン</small>
              </button>
            </li>
            <li v-for="t in availableEventTypes" :key="t.id">
              <button
                type="button"
                class="panel is-interactive p-panel-pad-compact flex items-center gap-micro-gap"
                :class="{ 'is-active': isTypeSelected(t.id) }"
                :style="{ '--theme-accent': t.color, '--glow-color': t.color }"
                @click="toggleTypeFilter(t.id)"
              >
                <span class="w-2 h-2 shrink-0" :style="{ backgroundColor: t.color }" />
                <small>{{ t.name }}</small>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>

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

    <ModalCalendarEvent
      v-model="isModalOpen"
      :is-editing="isEditing"
      :event-types="availableEventTypes"
      :initial-data="form"
      :site-members="siteMembers"
      :readonly="isReadonly"
      @save="saveEvent"
      @delete="removeEvent"
      @duplicate="duplicateEvent"
    />

    <ModalCalendarTypeSettings v-model="isTypeSettingsOpen" :event-types="availableEventTypes" @save="handleSaveEventTypes" />
  </div>
</template>

<style scoped lang="scss">
/* stylelint-disable property-disallowed-list -- FullCalendarライブラリ動的生成DOMの配置スタイリングのため例外許可 */
.filter-bar {
  border-top: var(--border-width-base) solid color-mix(in srgb, var(--color-border) 40%, transparent);

  button.panel {
    padding: var(--space-0-5) var(--space-2);
  }
}

.calendar-panel {
  --fc-border-color: var(--color-border);
  --fc-page-bg-color: transparent;
  --fc-neutral-bg-color: transparent;
  --fc-today-bg-color: color-mix(in srgb, var(--theme-accent) 10%, transparent);
  --fc-now-indicator-color: var(--color-status-danger);

  :deep(.fc-theme-standard td),
  :deep(.fc-theme-standard th),
  :deep(.fc-theme-standard .fc-scrollgrid) {
    border-color: var(--color-border);
  }

  /* 曜日ヘッダー文字 */
  :deep(.fc-col-header-cell-cushion) {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-main);
  }

  :deep(.is-saturday .fc-col-header-cell-cushion) {
    color: var(--color-calendar-saturday);
  }

  :deep(.is-sunday .fc-col-header-cell-cushion) {
    color: var(--color-calendar-sunday);
  }

  /* 日付セル番号 (月表示 & 週表示共通) */
  :deep(.fc-daygrid-day),
  :deep(.fc-timegrid-col) {
    &.is-saturday {
      background-color: color-mix(in srgb, var(--color-calendar-saturday) 4%, var(--surface-bg-sunken));
    }

    &.is-sunday,
    &.is-holiday {
      background-color: color-mix(in srgb, var(--color-calendar-sunday) 5%, var(--surface-bg-sunken));
    }

    &.is-custom-holiday {
      background-color: color-mix(in srgb, var(--color-calendar-custom-holiday) 8%, var(--surface-bg-sunken));
    }
  }

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

      font-family: var(--font-mono);
      font-size: var(--font-size-xs);
      font-variant-numeric: tabular-nums;
      color: var(--color-text-main);
    }

    &.is-saturday .fc-daygrid-day-number {
      color: var(--color-calendar-saturday);
    }

    &.is-sunday .fc-daygrid-day-number,
    &.is-holiday .fc-daygrid-day-number {
      color: var(--color-calendar-sunday);
    }

    &.is-custom-holiday .fc-daygrid-day-number {
      font-weight: var(--font-weight-semibold);
      color: var(--color-calendar-custom-holiday);
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

  /* 24時間タイムライン (timeGridWeek) */
  :deep(.fc-timegrid-slot-label-cushion),
  :deep(.fc-timegrid-axis-cushion) {
    font-family: var(--font-mono);
    font-size: var(--font-size-2xs);
    font-variant-numeric: tabular-nums;
    color: var(--color-text-muted);
  }

  :deep(.fc-timegrid-slot-minor) {
    border-top-style: dashed;
  }

  /* イベントバッジ（月表示・週タイムライン共通） */
  :deep(.fc-daygrid-event),
  :deep(.fc-timegrid-event) {
    --glow-color: var(--event-color, var(--theme-accent));

    @include control-glow-tokens;

    margin-bottom: var(--space-0-5);
    padding: var(--space-0-5) var(--space-1);
    border: var(--border-width-base) solid color-mix(in srgb, var(--glow-color) 45%, var(--color-border));
    border-radius: 0;

    background:
      linear-gradient(
        90deg,
        color-mix(in srgb, var(--glow-color) 18%, transparent) 0%,
        color-mix(in srgb, var(--glow-color) 6%, var(--surface-bg-elevated)) 100%
      );

    transition: var(--transition-interactive);

    @include state-interactive;

    &.is-milestone {
      border-color: color-mix(in srgb, var(--glow-color) 75%, var(--color-border));
      background:
        linear-gradient(
          90deg,
          color-mix(in srgb, var(--glow-color) 28%, transparent) 0%,
          color-mix(in srgb, var(--glow-color) 10%, var(--surface-bg-elevated)) 100%
        );
      box-shadow: var(--shadow-glow-sm);

      .fc-event-title {
        font-weight: var(--font-weight-semibold);

        &::before {
          content: "⚑ ";
        }
      }
    }

    &.is-personal {
      border-style: dashed;

      .fc-event-title::before {
        content: "[個人] ";
        font-family: var(--font-mono);
        font-size: var(--font-size-2xs);
        color: var(--glow-color);
      }

      &.is-milestone .fc-event-title::before {
        content: "⚑ [個人] ";
      }
    }

    &[data-countdown] .fc-event-main::after {
      content: attr(data-countdown);

      flex-shrink: 0;

      padding: 0 var(--space-1);
      border: var(--border-width-base) solid color-mix(in srgb, var(--glow-color) 60%, var(--color-border));

      font-family: var(--font-mono);
      font-size: var(--font-size-2xs);
      font-weight: var(--font-weight-semibold);
      font-variant-numeric: tabular-nums;
      color: var(--color-text-main);

      background-color: color-mix(in srgb, var(--glow-color) 24%, var(--surface-bg));
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
      font-weight: var(--font-weight-medium);
      font-variant-numeric: tabular-nums;
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
      border-color: var(--glow-color);
      background:
        linear-gradient(
          90deg,
          color-mix(in srgb, var(--glow-color) 32%, transparent) 0%,
          color-mix(in srgb, var(--glow-color) 14%, var(--surface-bg-elevated)) 100%
        );
      box-shadow: var(--surface-rim-accent), var(--shadow-glow-hover);
    }
  }

  /* 「+○件」展開リンク */
  :deep(.fc-daygrid-more-link) {
    font-size: var(--font-size-2xs);
    font-weight: var(--font-weight-semibold);
    color: var(--theme-accent);
  }

  /* ポップオーバー */
  :deep(.fc-popover) {
    @include control-glow-tokens;

    z-index: var(--z-index-modal);

    border: var(--border-width-base) solid var(--color-border);
    border-radius: 0;

    background: var(--surface-bg-elevated);
    box-shadow: var(--shadow-glow-ambient), var(--shadow-elevation-lg);

    .fc-popover-header {
      padding: var(--space-1) var(--space-2);
      border-bottom: var(--border-width-base) solid var(--color-border);
      border-radius: 0;

      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
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

    .fc-list-event {
      --glow-color: var(--event-color, var(--theme-accent));

      @include state-interactive;

      &.is-personal .fc-list-event-title a::before {
        content: "[個人] ";

        font-family: var(--font-mono);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
        color: var(--glow-color);
      }

      &[data-countdown] .fc-list-event-title a::after {
        content: " [" attr(data-countdown) "]";

        font-family: var(--font-mono);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
        color: var(--glow-color);
      }

      &:hover td {
        background: color-mix(in srgb, var(--glow-color) 12%, var(--surface-bg-elevated));
      }
    }
  }
}

.calendar-toolbar {
  border: var(--border-width-base) solid color-mix(in srgb, var(--color-border) 30%, transparent);
  background-color: var(--surface-bg);

  button.panel {
    padding: var(--space-0-5) var(--space-2);
  }
}

.toolbar-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--theme-accent);
}
</style>
