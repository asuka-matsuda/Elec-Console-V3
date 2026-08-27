
import { useState, useAsyncData } from '#app';

export interface CalendarEvent {
  id: string;
  siteId: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  type?: string;
}

export interface CalendarSettings {
  siteId: string;
  eventTypes: string[];
  holidayDays: number[];
}

export const useCalendar = (siteId: string) => {
  const events = useState<CalendarEvent[]>(`calendar-events-${siteId}`, () => []);
  const settings = useState<CalendarSettings | null>(`calendar-settings-${siteId}`, () => null);

  const { refresh: fetchEvents } = useAsyncData(`fetch-events-${siteId}`, async () => {
    const data = await $fetch<CalendarEvent[]>(`/api/sites/${siteId}/events`);
    events.value = data;
    return data;
  });

  const { refresh: fetchSettings } = useAsyncData(`fetch-settings-${siteId}`, async () => {
    const data = await $fetch<CalendarSettings>(`/api/sites/${siteId}/calendar/settings`);
    settings.value = data;
    return data;
  });

  const createEvent = async (event: Omit<CalendarEvent, 'id' | 'siteId'>) => {
    const res = await $fetch<CalendarEvent>(`/api/sites/${siteId}/events`, {
      method: 'POST',
      body: event,
    });
    events.value.push(res);
    return res;
  };

  const updateEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    const res = await $fetch<CalendarEvent>(`/api/events/${id}`, {
      method: 'PUT',
      body: updates,
    });
    if (res) {
      events.value = events.value.map(e => e.id === id ? res : e);
    }
  };

  const deleteEvent = async (id: string) => {
    await $fetch(`/api/events/${id}`, { method: 'DELETE' });
    events.value = events.value.filter(e => e.id !== id);
  };

  const updateSettings = async (updates: Partial<CalendarSettings>) => {
    const res = await $fetch<CalendarSettings>(`/api/sites/${siteId}/calendar/settings`, {
      method: 'PUT',
      body: updates,
    });
    settings.value = res;
  };

  return {
    events,
    settings,
    fetchEvents,
    fetchSettings,
    createEvent,
    updateEvent,
    deleteEvent,
    updateSettings,
  };
};
