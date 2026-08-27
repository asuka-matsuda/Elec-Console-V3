
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

export interface EventType {
  id: string;
  name: string;
  colorVar: string; // CSS custom property name like 'primary', 'danger', 'category-database'
}

export interface CalendarSettings {
  siteId: string;
  eventTypes: EventType[];
  holidayDays: number[]; // 0=Sun, 6=Sat
  customHolidays: string[]; // YYYY-MM-DD
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
    try {
      const res = await $fetch<CalendarEvent>(`/api/sites/${siteId}/events`, {
        method: 'POST',
        body: event,
      });
      events.value.push(res);
      return res;
    } catch (e) {
      console.warn("API createEvent failed, using mock data", e);
      const mockEvent = { ...event, id: Date.now().toString(), siteId };
      events.value.push(mockEvent);
      return mockEvent;
    }
  };

  const updateEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    try {
      const res = await $fetch<CalendarEvent>(`/api/events/${id}`, {
        method: 'PUT',
        body: updates,
      });
      if (res) {
        events.value = events.value.map(e => e.id === id ? res : e);
      }
    } catch (e) {
      console.warn("API updateEvent failed, using mock data", e);
      events.value = events.value.map(e => e.id === id ? { ...e, ...updates } : e);
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
