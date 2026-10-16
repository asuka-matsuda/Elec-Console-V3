/**
 * FullCalendar オプション構成 Composable
 *
 * @description カレンダーのビュー設定、イベント描画、日付選択ハンドラーを構築します。
 */

import type {
  CalendarOptions,
  DateSelectArg,
  DayCellContentArg,
  EventClickArg,
  EventDropArg,
  EventMountArg,
} from '@fullcalendar/core'
import jaLocale from '@fullcalendar/core/locales/ja'
import dayGridPlugin from '@fullcalendar/daygrid'
import type { EventResizeDoneArg } from '@fullcalendar/interaction'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import timeGridPlugin from '@fullcalendar/timegrid'
import type FullCalendar from '@fullcalendar/vue3'
import { computed, type Ref, ref } from 'vue'

import {
  type CalendarEvent,
  type CalendarSettings,
  DEFAULT_CALENDAR_EVENT_TYPES,
} from '#shared/types/calendar'
import { useAuth } from '~/composables/useAuth'
import { DEFAULT_COLOR } from '~/constants/colors'
import {
  calculateRemainingWorkingDays,
  formatToDateInputString,
  isJapaneseNationalHoliday,
} from '~/utils/date'

export type CalendarViewType = 'dayGridMonth' | 'timeGridWeek' | 'listMonth'

interface UseCalendarOptionsConfig {
  events: Ref<CalendarEvent[]>
  settings: Ref<CalendarSettings | null>
  activeTypeFilter?: Ref<string>
  readonly?: Ref<boolean>
  onSelectDate: (selectInfo: DateSelectArg) => void
  onEventClick: (clickInfo: EventClickArg) => void
  onEventDrop: (dropInfo: EventDropArg) => Promise<void>
  onEventResize: (resizeInfo: EventResizeDoneArg) => Promise<void>
}

/**
 * FullCalendar のオプション構成およびツールバー操作を管理するComposable
 */
export function useCalendarOptions({
  events,
  settings,
  activeTypeFilter,
  readonly,
  onSelectDate,
  onEventClick,
  onEventDrop,
  onEventResize,
}: UseCalendarOptionsConfig) {
  const { getAccurateNow } = useAuth()
  const fullCalendarRef = ref<InstanceType<typeof FullCalendar> | null>(null)
  const currentTitle = ref('')
  const currentView = ref<CalendarViewType>('dayGridMonth')
  const currentYearMonth = ref('')

  const handlePrev = () => fullCalendarRef.value?.getApi().prev()
  const handleNext = () => fullCalendarRef.value?.getApi().next()
  const handleToday = () => fullCalendarRef.value?.getApi().today()
  const handleViewChange = (view: CalendarViewType) => {
    currentView.value = view
    fullCalendarRef.value?.getApi().changeView(view)
  }

  const gotoDate = (dateStr: string) => {
    const clean = dateStr.split('T')[0] || dateStr

    if (clean) {
      fullCalendarRef.value?.getApi().gotoDate(clean)
    }
  }

  const formattedEvents = computed(() => {
    const todayStr = formatToDateInputString(getAccurateNow())
    const holidayDays = settings.value?.holidayDays ?? [0, 6]
    const customHolidays = settings.value?.customHolidays ?? []
    const availableTypes = settings.value?.eventTypes?.length
      ? settings.value.eventTypes
      : DEFAULT_CALENDAR_EVENT_TYPES
    const filterVal = activeTypeFilter?.value || 'all'

    return events.value
      .filter((evt) => {
        if (!filterVal || filterVal === 'all') return true
        const isMilestone = Boolean(evt.isMilestone || evt.type === 'milestone')

        if (filterVal === 'milestone') return isMilestone
        if (isMilestone) return false

        return evt.type === filterVal
      })
      .map((evt) => {
        const isMilestone = Boolean(evt.isMilestone || evt.type === 'milestone')
        const typeDef = availableTypes.find(t => t.id === evt.type)
        const color = isMilestone ? '#f85149' : (typeDef?.color || DEFAULT_COLOR)
        const startOnly = evt.start.split('T')[0] || evt.start
        const isPastMilestone = isMilestone && startOnly < todayStr
        const remainingDays = isMilestone && !isPastMilestone
          ? calculateRemainingWorkingDays(todayStr, startOnly, holidayDays, customHolidays)
          : -1
        const countdownText = isMilestone && !isPastMilestone
          ? (startOnly === todayStr ? '本日' : `あと${remainingDays}日`)
          : ''

        const classNames: string[] = []

        if (isMilestone) classNames.push('is-milestone')
        if (isPastMilestone) classNames.push('is-past-milestone')

        return {
          ...evt,
          classNames,
          borderColor: color,
          backgroundColor: 'transparent',
          textColor: 'inherit',
          extendedProps: {
            type: evt.type,
            typeName: isMilestone ? 'マイルストーン' : (typeDef?.name || '予定'),
            themeColor: color,
            isMilestone,
            isPastMilestone,
            remainingDays,
            countdownText,
            location: evt.location || null,
            description: evt.description || null,
            assignees: Array.isArray(evt.assignees) ? evt.assignees : [],
            createdBy: evt.createdBy || null,
            updatedBy: evt.updatedBy || null,
            createdAt: evt.createdAt,
            updatedAt: evt.updatedAt,
            sortPriority: isMilestone ? 0 : 1,
          },
        }
      })
  })

  const calendarOptions = computed<CalendarOptions>(() => {
    const holidayDays = settings.value?.holidayDays ?? [0, 6]
    const customHolidays = settings.value?.customHolidays ?? []
    const isReadonly = Boolean(readonly?.value)

    return {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
      initialView: 'dayGridMonth',
      locale: jaLocale,
      events: formattedEvents.value,
      eventOrder: 'extendedProps.sortPriority,start,-duration,allDay,title',
      eventDisplay: 'block',
      displayEventEnd: true,
      allDayText: '終日',
      slotMinTime: '00:00:00',
      slotMaxTime: '24:00:00',
      nowIndicator: true,
      eventTimeFormat: {
        hour: '2-digit',
        minute: '2-digit',
        meridiem: false,
        hour12: false,
      },
      slotLabelFormat: {
        hour: '2-digit',
        minute: '2-digit',
        meridiem: false,
        hour12: false,
      },
      editable: !isReadonly,
      selectable: !isReadonly,
      headerToolbar: false,
      dayMaxEvents: 3,
      moreLinkClick: 'popover' as const,
      moreLinkContent: (args: { num: number }) => `+${args.num}件`,
      datesSet: (arg: { view: { title: string, type: string, currentStart: Date } }) => {
        currentTitle.value = arg.view.title
        currentView.value = arg.view.type as CalendarViewType
        if (arg.view.currentStart) {
          const y = arg.view.currentStart.getFullYear()
          const m = String(arg.view.currentStart.getMonth() + 1).padStart(2, '0')

          currentYearMonth.value = `${y}-${m}`
        }
      },
      height: 'auto',
      dayHeaderClassNames: (arg: { date: Date }) => {
        const classes: string[] = []
        const day = arg.date.getDay()

        if (day === 6) {
          classes.push('is-saturday')
        }
        else if (day === 0 || holidayDays.includes(day)) {
          classes.push('is-sunday')
        }

        return classes
      },
      dayCellClassNames: (arg: DayCellContentArg) => {
        const classes: string[] = []
        const y = arg.date.getFullYear()
        const m = String(arg.date.getMonth() + 1).padStart(2, '0')
        const d = String(arg.date.getDate()).padStart(2, '0')
        const isoDate = `${y}-${m}-${d}`
        const day = arg.date.getDay()

        if (customHolidays.includes(isoDate)) {
          classes.push('is-custom-holiday')
        }
        else if (day === 0 || isJapaneseNationalHoliday(arg.date) || (day !== 6 && holidayDays.includes(day))) {
          classes.push('is-holiday', 'is-sunday')
        }
        else if (day === 6) {
          classes.push('is-saturday')
        }

        return classes
      },

      eventDidMount: (info: EventMountArg) => {
        const props = info.event.extendedProps || {}
        const color = props.themeColor as string | undefined

        if (color) {
          info.el.style.setProperty('--event-color', color)
          info.el.style.setProperty('--glow-color', color)
          info.el.style.removeProperty('border-color')
        }

        const countdownText = props.countdownText as string | undefined

        if (countdownText) {
          info.el.setAttribute('data-countdown', countdownText)
        }
        else {
          info.el.removeAttribute('data-countdown')
        }

        const tooltipLines: string[] = [
          `[${props.typeName || '予定'}] ${info.event.title}${countdownText ? ` (${countdownText})` : ''}`,
        ]

        if (props.location) {
          tooltipLines.push(`場所: ${props.location}`)
        }
        if (Array.isArray(props.assignees) && props.assignees.length > 0) {
          tooltipLines.push(`担当: ${props.assignees.join(', ')}`)
        }
        if (props.description) {
          tooltipLines.push(`メモ: ${props.description}`)
        }
        if (props.createdBy || props.updatedBy) {
          const auditParts: string[] = []

          if (props.createdBy) auditParts.push(`登録: ${props.createdBy}`)
          if (props.updatedBy) auditParts.push(`最終更新: ${props.updatedBy}`)
          tooltipLines.push(auditParts.join(' / '))
        }

        info.el.setAttribute('title', tooltipLines.join('\n'))
      },

      select: onSelectDate,
      eventClick: onEventClick,
      eventDrop: onEventDrop,
      eventResize: onEventResize,
    }
  })

  return {
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
  }
}
