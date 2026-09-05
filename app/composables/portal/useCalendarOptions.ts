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
import type FullCalendar from '@fullcalendar/vue3'
import { computed, type Ref, ref } from 'vue'

import type {
  CalendarEvent,
  CalendarSettings,
} from '~/composables/portal/useCalendar'

export interface UseCalendarOptionsConfig {
  events: Ref<CalendarEvent[]>
  settings: Ref<CalendarSettings | null>
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
  onSelectDate,
  onEventClick,
  onEventDrop,
  onEventResize,
}: UseCalendarOptionsConfig) {
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

  const calendarOptions = computed<CalendarOptions>(() => ({
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
      if (settings.value?.customHolidays?.includes(isoDate)) {
        classes.push('is-holiday')
      }

      return classes
    },

    select: onSelectDate,
    eventClick: onEventClick,
    eventDrop: onEventDrop,
    eventResize: onEventResize,
  }))

  return {
    fullCalendarRef,
    currentTitle,
    currentView,
    calendarOptions,
    handlePrev,
    handleNext,
    handleToday,
    handleViewChange,
  }
}
