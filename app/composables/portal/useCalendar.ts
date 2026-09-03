import { useAsyncData, useState } from '#app'
import { useApi } from '~/composables/useApi'

export interface CalendarEvent {
  id: string
  siteId: string
  title: string
  start: string
  end?: string
  allDay?: boolean
  type?: string
}

export interface EventType {
  id: string
  name: string
  color: string // CSS変数またはHEXカラー（例: 'var(--color-primary)', '#00f0ff'）
  colorVar?: string
}

export const DEFAULT_EVENT_TYPES: EventType[] = [
  { id: 'work', name: '現場作業', color: '#00f0ff' },
  { id: 'meeting', name: '打合せ', color: '#0ea5e9' },
  { id: 'inspection', name: '立会検査', color: '#f59e0b' },
  { id: 'delivery', name: '納品・搬入', color: '#10b981' },
]

export interface CalendarSettings {
  siteId: string
  eventTypes: EventType[]
  holidayDays: number[] // 0=Sun, 6=Sat
  customHolidays: string[] // YYYY-MM-DD
}

export const useCalendar = (siteId: string) => {
  const events = useState<CalendarEvent[]>(
    `calendar-events-${siteId}`,
    () => [],
  )
  const settings = useState<CalendarSettings | null>(
    `calendar-settings-${siteId}`,
    () => null,
  )
  const { $api } = useApi()

  const { refresh: fetchEvents } = useAsyncData(
    `fetch-events-${siteId}`,
    async () => {
      const data = await $api<CalendarEvent[]>(`/api/sites/${siteId}/events`)

      events.value = data

      return data
    },
  )

  const { refresh: fetchSettings } = useAsyncData(
    `fetch-settings-${siteId}`,
    async () => {
      const data = await $api<CalendarSettings>(
        `/api/sites/${siteId}/calendar/settings`,
      )

      if (data && (!data.eventTypes || data.eventTypes.length === 0)) {
        data.eventTypes = DEFAULT_EVENT_TYPES
      }
      settings.value = data

      return data
    },
  )

  const createEvent = async (event: Omit<CalendarEvent, 'id' | 'siteId'>) => {
    const res = await $api<CalendarEvent>(`/api/sites/${siteId}/events`, {
      method: 'POST',
      body: event,
    })

    events.value = [...events.value, res]

    return res
  }

  const updateEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    const res = await $api<CalendarEvent>(`/api/events/${id}`, {
      method: 'PUT',
      body: updates,
    })

    if (res) {
      events.value = events.value.map(e => (e.id === id ? res : e))
    }
  }

  const deleteEvent = async (id: string) => {
    await $api(`/api/events/${id}`, { method: 'DELETE' })
    events.value = events.value.filter(e => e.id !== id)
  }

  const updateSettings = async (updates: Partial<CalendarSettings>) => {
    const res = await $api<CalendarSettings>(
      `/api/sites/${siteId}/calendar/settings`,
      {
        method: 'PUT',
        body: updates,
      },
    )

    settings.value = res
  }

  return {
    events,
    settings,
    fetchEvents,
    fetchSettings,
    createEvent,
    updateEvent,
    deleteEvent,
    updateSettings,
  }
}
