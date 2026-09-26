/**
 * 現場カレンダー管理 Composable
 *
 * @description 現場に紐づく予定イベントの取得・日付移動・月間/週間ビューの切り替えを管理します。
 * @param siteId 対象現場ID
 */

import { useAsyncData, useState } from '#app'
import {
  type CalendarEvent,
  type CalendarSettings,
  DEFAULT_CALENDAR_EVENT_TYPES,
} from '#shared/types/calendar'
import { useApi } from '~/composables/useApi'
import { STATE_KEYS } from '~/constants/storageKeys'

export function useCalendar(siteId: string) {
  const events = useState<CalendarEvent[]>(
    STATE_KEYS.CALENDAR_EVENTS(siteId),
    () => [],
  )
  const settings = useState<CalendarSettings | null>(
    STATE_KEYS.CALENDAR_SETTINGS(siteId),
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
        data.eventTypes = DEFAULT_CALENDAR_EVENT_TYPES
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
