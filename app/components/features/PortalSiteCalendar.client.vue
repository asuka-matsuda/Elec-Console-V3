
<script setup lang="ts">
import { ref, computed } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';

import { useCalendar, type CalendarEvent } from '~/composables/portal/useCalendar';

const props = defineProps<{
  siteId: string;
}>();

const { events, settings, createEvent, updateEvent, deleteEvent } = useCalendar(props.siteId);

// ====================
// Modal State
// ====================
const isModalOpen = ref(false);
const isEditing = ref(false);
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

const openEditModal = (eventInfo: Record<string, any>) => {
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
    alert("タイトルを入力してください");
    return;
  }
  
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
  if (confirm("この予定を削除しますか？")) {
    await deleteEvent(editingEventId.value);
    closeModal();
  }
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
  dayCellClassNames: (arg: Record<string, any>) => {
    const classes = [];
    const dateStr = arg.date.toLocaleDateString('ja-JP').split('/').map(v => v.padStart(2, '0')).join('-'); // YYYY-MM-DD (rough local parsing)
    // 厳密なISOではないが、FullCalendarの内部日付に対応させる
    const isoDate = arg.date.getFullYear() + '-' + String(arg.date.getMonth() + 1).padStart(2, '0') + '-' + String(arg.date.getDate()).padStart(2, '0');
    
    if (arg.date.getDay() === 0) classes.push('is-sunday');
    if (arg.date.getDay() === 6) classes.push('is-saturday');
    if (settings.value?.customHolidays?.includes(isoDate)) classes.push('is-holiday');
    
    return classes;
  },
  eventDidMount: (info: Record<string, any>) => {
    // 予定種別からテーマカラーを取得してCSS変数として注入
    const typeId = info.event.extendedProps.type;
    const typeDef = settings.value?.eventTypes?.find(t => t.id === typeId);
    if (typeDef) {
      info.el.style.setProperty('--event-theme-color', `var(--color-${typeDef.colorVar})`);
    } else {
      info.el.style.setProperty('--event-theme-color', 'var(--color-primary)');
    }
  },

  select: (selectInfo: Record<string, any>) => {
    // カレンダー選択時にモーダルを開く
    openCreateModal(selectInfo.startStr, selectInfo.endStr, selectInfo.allDay);
    selectInfo.view.calendar.unselect();
  },
  eventClick: (clickInfo: Record<string, any>) => {
    // イベントクリック時に編集モーダルを開く
    openEditModal(clickInfo.event);
  },
  eventDrop: async (dropInfo: Record<string, any>) => {
    await updateEvent(dropInfo.event.id, {
      start: dropInfo.event.startStr,
      end: dropInfo.event.endStr || undefined,
      allDay: dropInfo.event.allDay
    });
  },
  eventResize: async (resizeInfo: Record<string, any>) => {
    await updateEvent(resizeInfo.event.id, {
      start: resizeInfo.event.startStr,
      end: resizeInfo.event.endStr || undefined
    });
  }
}));

const typedCalendarOptions = computed(() => calendarOptions.value as any);
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
          <AppInput v-model="form.title" placeholder="会議、送電試験など" required />
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
            <AppDateInput v-model="form.start" :type="form.allDay ? 'date' : 'datetime-local'" required />
          </div>
          <div class="p-event-form__field">
            <label class="u-text-sm u-text-muted">終了日時</label>
            <AppDateInput v-model="form.end" :type="form.allDay ? 'date' : 'datetime-local'" />
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
  :deep(.is-saturday .fc-daygrid-day-frame) {
    box-shadow: inset 0 0 24px color-mix(in srgb, var(--color-category-database) 15%, transparent);
  }
  :deep(.is-saturday .fc-col-header-cell-cushion),
  :deep(.is-saturday .fc-daygrid-day-number) {
    color: color-mix(in srgb, var(--color-category-database) 90%, transparent);
  }

  :deep(.is-sunday .fc-daygrid-day-frame),
  :deep(.is-holiday .fc-daygrid-day-frame) {
    box-shadow: inset 0 0 24px color-mix(in srgb, var(--color-status-danger) 20%, transparent);
  }
  :deep(.is-sunday .fc-col-header-cell-cushion),
  :deep(.is-sunday .fc-daygrid-day-number),
  :deep(.is-holiday .fc-col-header-cell-cushion),
  :deep(.is-holiday .fc-daygrid-day-number) {
    color: color-mix(in srgb, var(--color-status-danger) 90%, transparent);
  }

  :deep(.fc-day-today .fc-daygrid-day-frame) {
    box-shadow: inset 0 0 20px color-mix(in srgb, var(--color-category-main) 20%, transparent);
  }
  :deep(.fc-day-today .fc-daygrid-day-number) {
    font-weight: bold;
    color: var(--color-category-main);
  }

  /* セルのホバー */
  :deep(.fc-daygrid-day-frame) {
    transition: background-color 0.2s ease, box-shadow 0.2s ease;
  }
  :deep(.fc-daygrid-day-frame:hover:not(:has(.fc-daygrid-event:hover))) {
    box-shadow: inset 0 0 var(--blur-lg) color-mix(in srgb, var(--color-category-main) 20%, transparent), 
                inset 0 0 0 1px color-mix(in srgb, var(--color-category-main) 50%, transparent);
  }

  /* イベントの動的カラー */
  :deep(.fc-daygrid-event) {
    padding: 2px var(--space-1);
    background-color: color-mix(in srgb, var(--event-theme-color, var(--color-primary)) 20%, transparent);
    border: 1px solid color-mix(in srgb, var(--event-theme-color, var(--color-primary)) 50%, transparent);
    color: var(--color-text-main);
    border-radius: 4px;
    transition: all 0.2s ease;
  }
  :deep(.fc-daygrid-event:hover) {
    box-shadow: inset 0 0 var(--blur-lg) color-mix(in srgb, var(--event-theme-color, var(--color-primary)) 50%, transparent), 
                0 0 var(--blur-lg) color-mix(in srgb, var(--event-theme-color, var(--color-primary)) 30%, transparent);
    border-color: var(--event-theme-color, var(--color-primary));
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
