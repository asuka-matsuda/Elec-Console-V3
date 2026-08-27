
<script setup lang="ts">
import { ref, computed } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import type { CalendarOptions, EventClickArg, EventMountArg, DateSelectArg, EventDropArg, DayCellContentArg } from '@fullcalendar/core';
import type { EventResizeDoneArg } from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';

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
  form.value = {
      title: '',
      type: settings.value?.eventTypes[0]?.id || 'other',
      start: formatDateTimeLocal(startStr, allDay),
    end: formatDateTimeLocal(endStr, allDay),
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
      start: formatDateTimeLocal(eventInfo.startStr, eventInfo.allDay),
    end: formatDateTimeLocal(eventInfo.endStr, eventInfo.allDay),
    allDay: eventInfo.allDay
  };
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
};

const saveEvent = async () => {
  if (!form.value.title.trim()) {
    hasTitleError.value = true;
    return;
  }
  hasTitleError.value = false;
  
  if (isEditing.value && editingEventId.value) {
    await updateEvent(editingEventId.value, {
      title: form.value.title,
      type: form.value.type,
      start: form.value.start,
      end: form.value.end || undefined,
      allDay: form.value.allDay
    });
  } else {
    await createEvent({
      title: form.value.title,
      type: form.value.type,
      start: form.value.start,
      end: form.value.end || undefined,
      allDay: form.value.allDay
    });
  }
  closeModal();
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
  events: events.value,
  editable: true,
  selectable: true,
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,listMonth'
  },
  height: 'auto',
  dayCellClassNames: (arg: DayCellContentArg) => {
    const classes = [];
    const dateStr = arg.date.toLocaleDateString('ja-JP').split('/').map(v => v.padStart(2, '0')).join('-'); // YYYY-MM-DD (rough local parsing)
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
      info.el.style.setProperty('--event-theme-color', 'var(--color-primary)');
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
    <div class="c-calendar">
      <FullCalendar :options="typedCalendarOptions" />
    </div>

    <!-- Event Modal -->
    <AppModal v-model="isModalOpen" :title="isEditing ? '予定の編集' : '新しい予定'">
      <div class="p-event-form">
        <div class="p-event-form__field">
          <label class="u-text-sm u-text-muted">タイトル</label>
          <AppInput v-model="form.title" placeholder="会議、送電試験など" required :error="hasTitleError" />
          <span v-if="hasTitleError" class="u-text-sm" style="color: var(--color-status-danger); margin-top: 4px;">タイトルを入力してください</span>
        </div>
        <div class="p-event-form__field">
          <label class="u-text-sm u-text-muted">予定種別</label>
          <AppSelect 
            v-model="form.type" 
            :options="(settings?.eventTypes || []).map(t => ({ label: t.name, value: t.id }))" 
          />
        </div>
        
        <div class="p-event-form__row">
          <div class="p-event-form__field">
            <label class="u-text-sm u-text-muted">開始日時</label>
            <PortalEventDateInput v-model="form.start" :type="form.allDay ? 'date' : 'datetime-local'" required />
          </div>
          <div class="p-event-form__field">
            <label class="u-text-sm u-text-muted">終了日時</label>
            <PortalEventDateInput v-model="form.end" :type="form.allDay ? 'date' : 'datetime-local'" />
          </div>
        </div>
        
        <AppCheckbox v-model="form.allDay" label="終日イベント" />

        <div class="p-event-form__actions">
          <AppButton v-if="isEditing" variant="danger" @click="removeEvent">削除</AppButton>
          <div style="flex: 1"></div>
          <AppButton variant="secondary" @click="closeModal">キャンセル</AppButton>
          <AppButton variant="primary" @click="saveEvent">保存</AppButton>
        </div>
      </div>
    </AppModal>
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
  :deep(.fc-daygrid-day-number) {
    color: var(--color-text-main);
    text-decoration: none;
  }
  :deep(.fc-col-header-cell-cushion) {
    color: var(--color-text-main);
    text-decoration: none;
  }

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

  :deep(.is-saturday) {
    @include highlight-day(var(--color-category-database), 15%, 90%);
  }

  :deep(.is-sunday),
  :deep(.is-holiday) {
    @include highlight-day(var(--color-status-danger), 20%, 90%);
  }

  :deep(.fc-day-today) {
    .fc-daygrid-day-frame {
      box-shadow: inset 0 0 20px theme-color(var(--color-category-main), 20%);
    }
    .fc-daygrid-day-number {
      font-weight: bold;
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
    $event-color: var(--event-theme-color, var(--color-primary));
    
    padding: 2px var(--space-1);
    background-color: theme-color($event-color, 20%);
    border: 1px solid theme-color($event-color, 50%);
    color: var(--color-text-main);
    border-radius: var(--radius-sm);
    transition: var(--transition-glow);

    &:hover {
      box-shadow: 
        inset 0 0 var(--blur-lg) theme-color($event-color, 50%), 
        0 0 var(--blur-lg) theme-color($event-color, 30%);
      border-color: $event-color;
    }
    
    .fc-event-main {
      font-weight: 500;
    }
  }

}

.p-event-form {
  @include flex-column(var(--gap-md));
  padding: var(--pad-sm) 0;

  
  &__field {
    @include flex-column(var(--gap-xs));
  }
  
  &__row {
    @include flex-start(var(--gap-md));
    > * { flex: 1; }
  }

  &__actions {
    @include flex-start(var(--gap-sm));
    margin-top: var(--gap-md);
    padding-top: var(--pad-sm);
    border-top: var(--border-width-base) solid var(--color-border);
  }
}
</style>
