<script setup lang="ts">
import { ref, computed } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import type { CalendarOptions, EventClickArg, EventMountArg, DateSelectArg, EventDropArg, DayCellContentArg } from '@fullcalendar/core';
import type { EventResizeDoneArg } from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import jaLocale from '@fullcalendar/core/locales/ja';

import { useCalendar } from '~/composables/portal/useCalendar';

const props = defineProps<{
  siteId: string;
}>();

const { events, settings, createEvent, updateEvent, deleteEvent } = useCalendar(props.siteId);

// ====================
// Modal State
// ====================
const isModalOpen = ref(false);
const isEditing = ref(false);
const hasTitleError = ref(false);
const editingEventId = ref<string | null>(null);

const form = ref({
  title: '',
  type: '',
  start: '',
  end: '',
  allDay: false
});

const formatDateTimeLocal = (dateStr: string, isAllDay: boolean) => {
  if (!dateStr) return '';
  if (isAllDay) {
    return dateStr.split('T')[0];
  }
  if (dateStr.includes('T')) {
    return dateStr.substring(0, 16);
  }
  return dateStr + 'T09:00';
};

hasTitleError.value = false;
  const openCreateModal = (startStr: string, endStr: string, allDay: boolean) => {
  isEditing.value = false;
  editingEventId.value = null;
  
  let initialEnd = endStr;
  if (allDay && startStr && endStr) {
    const sDate = new Date(startStr);
    const eDate = new Date(endStr);
    if (!isNaN(sDate.getTime()) && !isNaN(eDate.getTime())) {
      // FullCalendar gives exclusive end date. If user selects 1 cell, diff is 1 day.
      // We want to show the same day in UI.
      eDate.setDate(eDate.getDate() - 1);
      initialEnd = eDate.getFullYear() + '-' + String(eDate.getMonth() + 1).padStart(2, '0') + '-' + String(eDate.getDate()).padStart(2, '0');
    }
  }

  form.value = {
    title: '',
    type: settings.value?.eventTypes[0]?.id || 'other',
    start: formatDateTimeLocal(startStr, allDay) || '',
    end: formatDateTimeLocal(initialEnd, allDay) || '',
    allDay
  };
  isModalOpen.value = true;
};

hasTitleError.value = false;
  const openEditModal = (eventInfo: import('@fullcalendar/core').EventApi) => {
  isEditing.value = true;
  editingEventId.value = eventInfo.id;
  form.value = {
      title: eventInfo.title,
      type: eventInfo.extendedProps?.type || 'other',
      start: formatDateTimeLocal(eventInfo.startStr, eventInfo.allDay) || '',
    end: formatDateTimeLocal(eventInfo.endStr, eventInfo.allDay) || '',
    allDay: eventInfo.allDay
  };
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
};

const saveEvent = async (savedData: { title: string, type: string, start: string, end: string, allDay: boolean }) => {
  let finalEnd = savedData.end || undefined;
  
  if (savedData.allDay && savedData.start && savedData.end) {
    if (savedData.start === savedData.end) {
      finalEnd = undefined;
    } else {
      const endDate = new Date(savedData.end);
      endDate.setDate(endDate.getDate() + 1);
      finalEnd = endDate.toISOString().split('T')[0];
    }
  }

  try {
    if (isEditing.value && editingEventId.value) {
      await updateEvent(editingEventId.value, {
        title: savedData.title,
        type: savedData.type,
        start: savedData.start,
        end: finalEnd,
        allDay: savedData.allDay
      });
    } else {
      await createEvent({
        title: savedData.title,
        type: savedData.type,
        start: savedData.start,
        end: finalEnd,
        allDay: savedData.allDay
      });
    }
  } finally {
    isModalOpen.value = false;
  }
};

const removeEvent = async () => {
  if (!editingEventId.value) return;
  // TODO: Implement custom confirm dialog
  await deleteEvent(editingEventId.value);
  closeModal();
};

// ====================
// Calendar Config
// ====================
const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, interactionPlugin, listPlugin],
  initialView: 'dayGridMonth',
  locale: jaLocale,
  events: events.value,
  editable: true,
  selectable: true,
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,listMonth'
  },
  height: 'auto',
  dayHeaderClassNames: (arg: { date: Date }) => {
    const classes = [];
    if (arg.date.getDay() === 0) classes.push('is-sunday');
    if (arg.date.getDay() === 6) classes.push('is-saturday');
    return classes;
  },
  dayCellClassNames: (arg: DayCellContentArg) => {
    const classes = [];
    // 厳密なISOではないが、FullCalendarの内部日付に対応させる
    const isoDate = arg.date.getFullYear() + '-' + String(arg.date.getMonth() + 1).padStart(2, '0') + '-' + String(arg.date.getDate()).padStart(2, '0');
    
    if (arg.date.getDay() === 0) classes.push('is-sunday');
    if (arg.date.getDay() === 6) classes.push('is-saturday');
    if (settings.value?.customHolidays?.includes(isoDate)) classes.push('is-holiday');
    
    return classes;
  },
  eventDidMount: (info: EventMountArg) => {
    // 予定種別からテーマカラーを取得してCSS変数として注入
    const typeId = info.event.extendedProps.type;
    const typeDef = settings.value?.eventTypes?.find(t => t.id === typeId);
    if (typeDef) {
      info.el.style.setProperty('--event-theme-color', `var(--color-${typeDef.colorVar})`);
    } else {
      info.el.style.setProperty('--event-theme-color', 'var(--color-category-main)');
    }
  },

  select: (selectInfo: DateSelectArg) => {
    // カレンダー選択時にモーダルを開く
    openCreateModal(selectInfo.startStr, selectInfo.endStr, selectInfo.allDay);
    selectInfo.view.calendar.unselect();
  },
  eventClick: (clickInfo: EventClickArg) => {
    // イベントクリック時に編集モーダルを開く
    openEditModal(clickInfo.event);
  },
  eventDrop: async (dropInfo: EventDropArg) => {
    await updateEvent(dropInfo.event.id, {
      start: dropInfo.event.startStr,
      end: dropInfo.event.endStr || undefined,
      allDay: dropInfo.event.allDay
    });
  },
  eventResize: async (resizeInfo: EventResizeDoneArg) => {
    await updateEvent(resizeInfo.event.id, {
      start: resizeInfo.event.startStr,
      end: resizeInfo.event.endStr || undefined
    });
  }
}));

const typedCalendarOptions = computed(() => calendarOptions.value as CalendarOptions);
</script>

<template>
  <div class="c-calendar-wrapper">
    <AppPanel
      class="c-calendar"
      variant="simple"
    >
      <FullCalendar :options="typedCalendarOptions" />
    </AppPanel>

    <!-- Event Modal -->
    <CalendarEventModal
      v-model="isModalOpen"
      :is-editing="isEditing"
      :event-types="settings?.eventTypes || []"
      :initial-data="form"
      @save="saveEvent"
      @delete="removeEvent"
    />
  </div>
</template>

<style scoped lang="scss">
.c-calendar-wrapper {
  @include flex-column(var(--space-stack-gap));
}

.c-calendar {
  --fc-border-color: var(--color-border);
  --fc-page-bg-color: transparent;
  --fc-neutral-bg-color: transparent;
  --calendar-saturday: #60a5fa;
  --calendar-sunday: #f87171;
  --calendar-holiday: #f87171;

  /* ==== 動的クラスによる装飾 ==== */
  
  @mixin highlight-day($color, $opacity-bg, $opacity-text) {
    & .fc-daygrid-day-frame {
      box-shadow: inset 0 0 24px theme-color($color, $opacity-bg);
    }

    & .fc-col-header-cell-cushion,
    & .fc-daygrid-day-number {
      color: theme-color($color, $opacity-text);
    }
  }

  min-height: 500px;

  :deep(.fc-theme-standard td), :deep(.fc-theme-standard th) {
    border-color: var(--color-border);
  }

  :deep(.fc-daygrid-day-number) {
    color: var(--color-text-main);
  }

  :deep(.fc-col-header-cell-cushion) {
    color: var(--color-text-main);
  }

  :deep(.is-saturday) {
    @include highlight-day(var(--calendar-saturday), 15%, 100%);
  }

  :deep(.is-sunday),
  :deep(.is-holiday) {
    @include highlight-day(var(--calendar-sunday), 20%, 100%);
  }

  :deep(.fc-day-today) {
    .fc-daygrid-day-frame {
      box-shadow: inset 0 0 20px theme-color(var(--color-category-main), 20%);
    }

    .fc-daygrid-day-number {
      font-weight: var(--font-weight-bold);
      color: var(--color-category-main);
    }
  }

  /* セルのホバー */
  :deep(.fc-daygrid-day-frame) {
    transition: background-color var(--duration-fast) var(--ease-smooth), box-shadow var(--duration-fast) var(--ease-smooth);
    
    &:hover:not(:has(.fc-daygrid-event:hover)) {
      box-shadow: 
        inset 0 0 var(--blur-lg) theme-color(var(--color-category-main), 20%), 
        inset 0 0 0 1px theme-color(var(--color-category-main), 50%);
    }
  }

  /* イベントの動的カラー */
  :deep(.fc-daygrid-event) {
    $event-color: var(--event-theme-color, var(--color-category-main));

    padding: var(--space-badge-p);
    border: 1px solid theme-color($event-color, 50%);

    color: var(--color-text-main);

    background-color: theme-color($event-color, 20%);

    transition: var(--transition-glow);

    &:hover {
      border-color: $event-color;
      box-shadow: 
        inset 0 0 var(--blur-lg) theme-color($event-color, 50%), 
        0 0 var(--blur-lg) theme-color($event-color, 30%);
    }
    
    .fc-event-main {
      font-weight: var(--font-weight-medium);
    }
  }
  
  @include mq("md") {
    min-height: 400px;
  }
}
</style>
