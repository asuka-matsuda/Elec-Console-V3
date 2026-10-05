<script setup lang="ts">
/**
 * Calendar
 * Geist デザインシステム準拠の日付・期間選択カレンダー（Molecules）。
 * 単一選択（single）および期間選択（range）、プリセット絞り込みに対応します。
 */
import { computed, ref } from 'vue'

import type { CalendarPreset, CalendarProps, DateRange } from '~/types/components'
import { formatToDateInputString, getTodayDateInput, parseDateSafe } from '~/utils/date'

// 単一選択用または期間選択用の modelValue
const model = defineModel<string | DateRange | null>({ default: null })

const {
  mode = 'single',
  size = 'md',
  min,
  max,
  presets = [],
  layout = 'horizontal',
  disabled = false,
} = defineProps<CalendarProps>()

const emit = defineEmits<{
  select: [value: string | DateRange]
}>()

// 今日の日付 (YYYY-MM-DD)
const todayStr = getTodayDateInput()

// 初期表示年月（選択値があればその月、なければ今月）
const getInitialYearMonth = (): { year: number, month: number } => {
  let targetDateStr = todayStr

  if (typeof model.value === 'string' && model.value) {
    targetDateStr = model.value
  }
  else if (model.value && typeof model.value === 'object' && 'start' in model.value && model.value.start) {
    targetDateStr = model.value.start
  }

  const d = parseDateSafe(targetDateStr) || parseDateSafe(todayStr) || new Date(2026, 9, 1)

  return { year: d.getFullYear(), month: d.getMonth() }
}

const initialYm = getInitialYearMonth()
const viewYear = ref(initialYm.year)
const viewMonth = ref(initialYm.month) // 0-indexed

// range 選択中のホバー・仮確定用
const rangeHoverDate = ref<string | null>(null)
const rangeSelectingStart = ref<string | null>(null)

// 年月表示テキスト
const viewTitle = computed(() => `${viewYear.value}年 ${viewMonth.value + 1}月`)

// 曜日ヘッダー
const WEEK_DAYS = ['日', '月', '火', '水', '木', '金', '土']

// 前月・次月・今日ナビゲーション
const handlePrevMonth = () => {
  if (viewMonth.value === 0) {
    viewYear.value--
    viewMonth.value = 11
  }
  else {
    viewMonth.value--
  }
}

const handleNextMonth = () => {
  if (viewMonth.value === 11) {
    viewYear.value++
    viewMonth.value = 0
  }
  else {
    viewMonth.value++
  }
}

const handleGoToday = () => {
  const d = parseDateSafe(todayStr) || new Date(2026, 9, 1)

  viewYear.value = d.getFullYear()
  viewMonth.value = d.getMonth()
}

// 選択状態の判定用正規化値
const selectedSingle = computed<string | null>(() => {
  if (mode === 'single' && typeof model.value === 'string') return model.value

  return null
})

const selectedRange = computed<DateRange>(() => {
  if (mode === 'range' && model.value && typeof model.value === 'object' && 'start' in model.value) {
    return model.value as DateRange
  }

  return { start: null, end: null }
})

// カレンダーグリッドの日付セル配列生成
interface CalendarCell {
  dateStr: string
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  isRangeStart: boolean
  isRangeEnd: boolean
  isInRange: boolean
  isDisabled: boolean
  dayOfWeek: number
}

const calendarDays = computed<CalendarCell[]>(() => {
  const year = viewYear.value
  const month = viewMonth.value

  // 当月の1日と末日
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()

  // 1日の曜日 (0: 日 〜 6: 土)
  const firstDayOfWeek = firstDay.getDay()

  // 前月の末日
  const prevMonthLastDay = new Date(year, month, 0).getDate()

  const cells: CalendarCell[] = []

  // 1. 前月分パディング
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i
    const prevDate = new Date(year, month - 1, day)
    const dateStr = formatToDateInputString(prevDate)

    cells.push(buildCell(prevDate, dateStr, day, false))
  }

  // 2. 当月分
  for (let day = 1; day <= daysInMonth; day++) {
    const currDate = new Date(year, month, day)
    const dateStr = formatToDateInputString(currDate)

    cells.push(buildCell(currDate, dateStr, day, true))
  }

  // 3. 翌月分パディング (合計行数が6行=42マスになるように埋める)
  const remaining = 42 - cells.length

  for (let day = 1; day <= remaining; day++) {
    const nextDate = new Date(year, month + 1, day)
    const dateStr = formatToDateInputString(nextDate)

    cells.push(buildCell(nextDate, dateStr, day, false))
  }

  return cells
})

const buildCell = (date: Date, dateStr: string, dayNumber: number, isCurrentMonth: boolean): CalendarCell => {
  const dayOfWeek = date.getDay()
  const isToday = dateStr === todayStr

  // min / max チェック
  let isDisabled = disabled

  if (min && dateStr < min) isDisabled = true
  if (max && dateStr > max) isDisabled = true

  // 選択判定
  const isSelected = mode === 'single' && selectedSingle.value === dateStr

  // 期間選択判定
  let isRangeStart = false
  let isRangeEnd = false
  let isInRange = false

  if (mode === 'range') {
    const currentStart = rangeSelectingStart.value || selectedRange.value.start
    const currentEnd = rangeSelectingStart.value ? rangeHoverDate.value : selectedRange.value.end

    if (currentStart && currentEnd) {
      const minD = currentStart <= currentEnd ? currentStart : currentEnd
      const maxD = currentStart <= currentEnd ? currentEnd : currentStart

      isRangeStart = dateStr === minD
      isRangeEnd = dateStr === maxD
      isInRange = dateStr > minD && dateStr < maxD
    }
    else if (currentStart) {
      isRangeStart = dateStr === currentStart
    }
  }

  return {
    dateStr,
    dayNumber,
    isCurrentMonth,
    isToday,
    isSelected,
    isRangeStart,
    isRangeEnd,
    isInRange,
    isDisabled,
    dayOfWeek,
  }
}

// 日付セルのクリック
const handleDayClick = (cell: CalendarCell) => {
  if (cell.isDisabled) return

  if (mode === 'single') {
    model.value = cell.dateStr
    emit('select', cell.dateStr)

    return
  }

  // range 選択
  if (!rangeSelectingStart.value) {
    // 1回目クリック: 始点設定
    rangeSelectingStart.value = cell.dateStr
  }
  else {
    // 2回目クリック: 終点確定
    const start = rangeSelectingStart.value
    const end = cell.dateStr

    const finalRange: DateRange = start <= end ? { start, end } : { start: end, end: start }

    model.value = finalRange
    rangeSelectingStart.value = null
    rangeHoverDate.value = null
    emit('select', finalRange)
  }
}

// ホバー処理 (期間選択プレビュー)
const handleDayMouseEnter = (cell: CalendarCell) => {
  if (mode === 'range' && rangeSelectingStart.value && !cell.isDisabled) {
    rangeHoverDate.value = cell.dateStr
  }
}

// プリセット選択
const handlePresetClick = (preset: CalendarPreset) => {
  if (disabled) return

  model.value = preset.range

  // カレンダーの表示月をプリセットの開始月に合わせる
  const startStr = typeof preset.range === 'string' ? preset.range : preset.range.start

  if (startStr) {
    const d = parseDateSafe(startStr)

    if (d) {
      viewYear.value = d.getFullYear()
      viewMonth.value = d.getMonth()
    }
  }

  emit('select', preset.range)
}

// プリセットのアクティブ判定
const isPresetActive = (preset: CalendarPreset): boolean => {
  if (!model.value) return false

  if (typeof preset.range === 'string') {
    return model.value === preset.range
  }

  if (typeof model.value === 'object' && 'start' in model.value) {
    return model.value.start === preset.range.start && model.value.end === preset.range.end
  }

  return false
}
</script>

<template>
  <div class="calendar panel" :class="[`calendar--${size}`, `calendar--${layout}`, { 'is-disabled': disabled }]">
    <!-- プリセット一覧 (horizontal: 左カラム / stacked: 上部行) -->
    <div v-if="presets.length > 0" class="calendar-presets flex" :class="layout === 'horizontal' ? 'flex-col gap-1 border-r border-border pr-3' : 'flex-wrap gap-1 border-b border-border pb-3 mb-3'">
      <Button
        v-for="preset in presets"
        :key="preset.label"
        size="sm"
        :variant="isPresetActive(preset) ? 'primary' : 'tertiary'"
        class="w-full text-left justify-start"
        :disabled="disabled"
        @click="handlePresetClick(preset)"
      >
        {{ preset.label }}
      </Button>
    </div>

    <!-- カレンダー本体グリッド -->
    <div class="calendar-body flex flex-col gap-item-gap">
      <!-- ヘッダー（年月表示・月送り） -->
      <header class="calendar-header flex items-center justify-between">
        <h4 class="calendar-title">
          {{ viewTitle }}
        </h4>
        <div class="flex items-center gap-inline-gap">
          <Button size="sm" variant="tertiary" icon="chevron-left" :disabled="disabled" @click="handlePrevMonth" />
          <Button size="sm" variant="tertiary" @click="handleGoToday">今日</Button>
          <Button size="sm" variant="tertiary" icon="chevron-right" :disabled="disabled" @click="handleNextMonth" />
        </div>
      </header>

      <!-- 曜日ヘッダー -->
      <div class="calendar-weekdays grid grid-cols-7 text-center">
        <span
          v-for="(w, idx) in WEEK_DAYS"
          :key="w"
          class="calendar-weekday"
          :class="{ 'is-sunday': idx === 0, 'is-saturday': idx === 6 }"
        >
          {{ w }}
        </span>
      </div>

      <!-- 日付セルグリッド (7列) -->
      <div class="calendar-grid grid grid-cols-7 gap-y-0.5">
        <button v-for="cell in calendarDays" :key="cell.dateStr" type="button" class="calendar-cell flex items-center justify-center" :class="{ 'is-other-month': !cell.isCurrentMonth, 'is-today': cell.isToday, 'is-picked': cell.isSelected, 'is-range-start': cell.isRangeStart, 'is-range-end': cell.isRangeEnd, 'is-in-range': cell.isInRange, 'is-disabled': cell.isDisabled, 'is-sunday': cell.dayOfWeek === 0, 'is-saturday': cell.dayOfWeek === 6 }" :disabled="cell.isDisabled" @click="handleDayClick(cell)" @mouseenter="handleDayMouseEnter(cell)">
          <span class="calendar-day-number">{{ cell.dayNumber }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.calendar {
  --cal-cell-size: 36px;
  --cal-font-size: var(--font-size-sm);

  user-select: none;

  display: inline-flex;
  gap: var(--space-4);

  padding: var(--space-4);
  border: var(--border-width-base) solid var(--color-border);
  border-radius: 0; // 直角規約

  color: var(--color-text-main);

  background-color: var(--surface-bg-elevated);
  box-shadow: var(--shadow-elevation-sm);

  // サイズ展開 (sm: 28px, md: 36px)
  &--sm {
    --cal-cell-size: 28px;
    --cal-font-size: var(--font-size-xs);

    gap: var(--space-3);
    padding: var(--space-3);
  }

  &--md {
    --cal-cell-size: 36px;
    --cal-font-size: var(--font-size-sm);
  }

  &.is-disabled {
    pointer-events: none;
    opacity: 0.6;
  }
}

.calendar-title {
  font-size: var(--cal-font-size);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-main);
  letter-spacing: var(--tracking-wide);
}

.calendar-weekday {
  padding-bottom: var(--space-1);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);

  &.is-saturday {
    color: var(--color-calendar-saturday);
  }

  &.is-sunday {
    color: var(--color-calendar-sunday);
  }
}

.calendar-cell {
  position: relative;

  width: var(--cal-cell-size);
  height: var(--cal-cell-size);
  padding: 0;
  border: 1px solid transparent;
  border-radius: 0; // 直角規約

  font-family: var(--font-mono);
  font-size: var(--cal-font-size);
  color: var(--color-text-main);

  background: transparent;

  transition: var(--transition-interactive);

  @include state-interactive;

  &:hover:not(:disabled) {
    border-color: var(--color-border);
    background-color: var(--color-bg-hover);
  }

  &.is-other-month {
    color: color-mix(in srgb, var(--color-text-muted) 40%, transparent);
  }

  &.is-saturday:not(.is-picked, .is-range-start, .is-range-end) {
    color: var(--color-calendar-saturday);
  }

  &.is-sunday:not(.is-picked, .is-range-start, .is-range-end) {
    color: var(--color-calendar-sunday);
  }

  // 今日の表示（控えめな枠線または太字）
  &.is-today:not(.is-picked, .is-range-start, .is-range-end) {
    border-color: color-mix(in srgb, var(--theme-accent) 50%, transparent);
    font-weight: var(--font-weight-bold);
  }

  // 単一選択
  &.is-picked {
    border-color: var(--theme-accent);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-on-emphasis);
    background-color: var(--theme-accent);
  }

  // 期間選択の始点・終点
  &.is-range-start,
  &.is-range-end {
    border-color: var(--theme-accent);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-on-emphasis);
    background-color: var(--theme-accent);
  }

  // 期間選択の範囲内
  &.is-in-range {
    border-color: color-mix(in srgb, var(--theme-accent) 25%, transparent);
    background-color: color-mix(in srgb, var(--theme-accent) 15%, var(--surface-bg-elevated));
  }

  &.is-disabled {
    border-color: transparent;
    opacity: 0.35;
    background: transparent;

    @include state-disabled;
  }
}
</style>
