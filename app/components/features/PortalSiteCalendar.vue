
<script setup lang="ts">
import { computed } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { CalendarOptions } from '@fullcalendar/core';
import { useCalendar } from '~/composables/portal/useCalendar';

const props = defineProps<{
  siteId: string;
}>();

const { events, createEvent, updateEvent } = useCalendar(props.siteId);

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  events: events.value,
  editable: true,
  selectable: true,
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,dayGridWeek'
  },
  height: '100%',
  select: async (selectInfo) => {
    const title = prompt('新しい予定を入力してください');
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect();
    if (title) {
      await createEvent({
        title,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        allDay: selectInfo.allDay
      });
    }
  },
  eventDrop: async (dropInfo) => {
    await updateEvent(dropInfo.event.id, {
      start: dropInfo.event.startStr,
      end: dropInfo.event.endStr || undefined
    });
  }
}));

const typedCalendarOptions = computed(() => calendarOptions.value as any);
</script>

<template>
  <div class="c-calendar-wrapper">
    <!-- TODO: 設定ボタン等は将来追加 -->
    <div class="c-calendar">
      <FullCalendar :options="typedCalendarOptions" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.c-calendar-wrapper {
  @include flex-column(var(--gap-md));
  height: 100%;
  flex: 1;
}

.c-calendar {
  flex: 1;
  background-color: var(--color-bg-base);
  border-radius: var(--radius-md);
  padding: var(--pad-md);
  border: var(--border-width-base) solid var(--color-border);
  min-height: 500px;
  
  :deep(.fc-theme-standard td), :deep(.fc-theme-standard th) {
    border-color: var(--color-border);
  }
  :deep(.fc-col-header-cell) {
    background-color: rgba(255, 255, 255, 0.05);
    padding: var(--pad-sm) 0;
  }
  :deep(.fc-event) {
    background-color: var(--color-primary);
    border: none;
    padding: 2px 4px;
    border-radius: 4px;
    cursor: pointer;
  }
  :deep(.fc-button-primary) {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
    &:hover {
      background-color: var(--color-primary-hover);
      border-color: var(--color-primary-hover);
    }
    &:disabled {
      background-color: var(--color-bg-hover);
      border-color: var(--color-bg-hover);
    }
  }
}
</style>
