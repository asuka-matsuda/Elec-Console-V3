
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

const { events, createEvent, updateEvent, deleteEvent } = useCalendar(props.siteId);

// ====================
// Modal State
// ====================
const isModalOpen = ref(false);
const isEditing = ref(false);
const editingEventId = ref<string | null>(null);

const form = ref({
  title: '',
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
      start: form.value.start,
      end: form.value.end || undefined,
      allDay: form.value.allDay
    });
  } else {
    await createEvent({
      title: form.value.title,
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
        
        <div class="p-event-form__row">
          <div class="p-event-form__field">
            <label class="u-text-sm u-text-muted">開始日時</label>
            <input v-model="form.start" :type="form.allDay ? 'date' : 'datetime-local'" required class="p-event-form__date-input" />
          </div>
          <div class="p-event-form__field">
            <label class="u-text-sm u-text-muted">終了日時</label>
            <input v-model="form.end" :type="form.allDay ? 'date' : 'datetime-local'" class="p-event-form__date-input" />
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
  :deep(.fc-day-today) {
    background-color: rgba(255, 255, 255, 0.05) !important;
  }
}

.p-event-form {
  @include flex-column(var(--gap-md));
  padding: var(--pad-sm) 0;

  
  &__date-input {
    width: 100%;
    height: var(--size-control-md);
    padding: var(--pad-element) var(--pad-component);
    font-family: var(--font-mono);
    font-size: var(--text-desc-size, 14px);
    color: var(--color-text-main);
    background-color: var(--color-bg-base);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    outline: none;
    transition: border-color var(--duration-fast) var(--ease-out);

    &:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 1px var(--color-primary);
    }
  }

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
