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
import CalendarEventModal from './CalendarEventModal.vue';

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

const {
  isOpen: isConfirmOpen,
  title: confirmTitle,
  message: confirmMessage,
  confirmText: confirmBtnText,
  intent: confirmIntent,
  askConfirm,
  handleConfirm,
} = useConfirmModal();

const removeEvent = () => {
  if (!editingEventId.value) return;
  const targetId = editingEventId.value;
  askConfirm({
    title: "予定の削除",
    message: `「${form.value.title || 'この予定'}」を削除してもよろしいですか？`,
    confirmText: "削除する",
    intent: "danger",
    onConfirm: async () => {
      await deleteEvent(targetId);
      closeModal();
    },
  });
};

// ====================
// Calendar Config & Custom Toolbar
// ====================
const fullCalendarRef = ref<InstanceType<typeof FullCalendar> | null>(null);
const currentTitle = ref('');
const currentView = ref<'dayGridMonth' | 'listMonth'>('dayGridMonth');

const handlePrev = () => {
  fullCalendarRef.value?.getApi().prev();
};

const handleNext = () => {
  fullCalendarRef.value?.getApi().next();
};

const handleToday = () => {
  fullCalendarRef.value?.getApi().today();
};

const handleViewChange = (view: 'dayGridMonth' | 'listMonth') => {
  currentView.value = view;
  fullCalendarRef.value?.getApi().changeView(view);
};

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, interactionPlugin, listPlugin],
  initialView: 'dayGridMonth',
  locale: jaLocale,
  events: events.value,
  editable: true,
  selectable: true,
  headerToolbar: false,
  datesSet: (arg: { view: { title: string; type: string } }) => {
    currentTitle.value = arg.view.title;
    currentView.value = arg.view.type as 'dayGridMonth' | 'listMonth';
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
    <div class="c-calendar-toolbar">
      <div class="c-calendar-toolbar__nav">
        <AppButton
          variant="secondary"
          size="sm"
          icon="chevron-left"
          icon-only
          aria-label="前月"
          @click="handlePrev"
        />
        <AppButton
          variant="secondary"
          size="sm"
          icon="chevron-right"
          icon-only
          aria-label="次月"
          @click="handleNext"
        />
        <AppButton
          variant="secondary"
          size="sm"
          @click="handleToday"
        >
          今日
        </AppButton>
      </div>

      <div class="c-calendar-toolbar__center">
        <h3 class="c-calendar-toolbar__title">
          {{ currentTitle }}
        </h3>
      </div>

      <div class="c-calendar-toolbar__views">
        <AppButton
          :variant="currentView === 'dayGridMonth' ? 'primary' : 'secondary'"
          size="sm"
          icon="calendar"
          @click="handleViewChange('dayGridMonth')"
        >
          月表示
        </AppButton>
        <AppButton
          :variant="currentView === 'listMonth' ? 'primary' : 'secondary'"
          size="sm"
          icon="list"
          @click="handleViewChange('listMonth')"
        >
          リスト
        </AppButton>
      </div>
    </div>

    <AppPanel
      class="c-calendar"
      variant="simple"
    >
      <FullCalendar
        ref="fullCalendarRef"
        :options="typedCalendarOptions"
      />
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

    <!-- Confirm Modal -->
    <AppConfirmModal
      v-model="isConfirmOpen"
      :title="confirmTitle"
      :message="confirmMessage"
      :confirm-text="confirmBtnText"
      :intent="confirmIntent"
      @confirm="handleConfirm"
    />
  </div>
</template>

<style scoped lang="scss">
.c-calendar-wrapper {
  @include flex-column(var(--space-stack-gap));
}

.c-calendar-toolbar {
  @include flex-between(var(--space-inline-gap));

  flex-wrap: wrap;
  padding: var(--space-card-pad-sm) var(--space-card-pad);

  @include border-dim;

  background-color: var(--color-surface);

  &__nav {
    @include flex-start(var(--space-inline-gap-sm));
  }

  &__center {
    @include flex-center;

    flex: 1;
    min-width: 160px;
  }

  &__title {
    @include text-title("md");

    color: var(--color-category-main);

    @include cyber-text-glow(var(--color-category-main), 60%, var(--blur-sm));
  }

  &__views {
    @include flex-end(var(--space-inline-gap-sm));
  }

  @include mq("md") {
    @include flex-column(var(--space-stack-gap-sm));

    &__center {
      order: -1;
      width: 100%;
    }

    &__nav,
    &__views {
      @include flex-center;

      width: 100%;
    }
  }
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

  /* リストビューの装飾 */
  :deep(.fc-list) {
    border: none;

    .fc-list-day-cushion {
      padding: var(--space-control-py-sm) var(--space-control-px);
      background-color: var(--color-bg-hover);
    }

    .fc-list-day-text,
    .fc-list-day-side-text {
      @include text-desc(true);

      color: var(--color-category-main);
    }

    .fc-list-event {
      @include click-enabled;
      @include state-base;

      &:hover td {
        background-color: theme-color(var(--color-category-main), 15%);
      }

      td {
        border-color: var(--color-border);
      }
    }

    .fc-list-event-title,
    .fc-list-event-time {
      @include text-desc;

      color: var(--color-text-main);
    }

    .fc-list-empty {
      @include text-body;

      padding: var(--space-card-pad);
      color: var(--color-text-muted);
      text-align: center;
      background-color: transparent;
    }
  }
  
  @include mq("md") {
    min-height: 400px;
  }
}
</style>
