
<script setup lang="ts">
import { computed } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

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
  height: 'auto', // 高さが潰れるのを防ぐためにautoに
  select: async (selectInfo: Record<string, any>) => {
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
  eventDrop: async (dropInfo: Record<string, any>) => {
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

  /* ==== 旧プロジェクトの装飾移植 ==== */
  
  /* 共通: リンク下線消去 */
  :deep(.fc-col-header-cell-cushion),
  :deep(.fc-daygrid-day-number) {
    color: var(--color-text-main);
    text-decoration: none !important;
    padding: var(--space-2);
  }

  /* 土曜日 (Saturday) */
  :deep(.fc-day-sat .fc-daygrid-day-frame) {
    box-shadow: inset 0 0 24px color-mix(in srgb, var(--color-category-database) 15%, transparent);
  }
  :deep(.fc-day-sat .fc-col-header-cell-cushion),
  :deep(.fc-day-sat .fc-daygrid-day-number) {
    color: color-mix(in srgb, var(--color-category-database) 90%, transparent);
  }

  /* 日曜日 (Sunday) & 休日 (.is-holiday) */
  :deep(.fc-day-sun .fc-daygrid-day-frame),
  :deep(.is-holiday .fc-daygrid-day-frame) {
    box-shadow: inset 0 0 24px color-mix(in srgb, var(--color-status-danger) 20%, transparent);
  }
  :deep(.fc-day-sun .fc-col-header-cell-cushion),
  :deep(.fc-day-sun .fc-daygrid-day-number),
  :deep(.is-holiday .fc-col-header-cell-cushion),
  :deep(.is-holiday .fc-daygrid-day-number) {
    color: color-mix(in srgb, var(--color-status-danger) 90%, transparent);
  }

  /* 今日のハイライト */
  :deep(.fc-day-today .fc-daygrid-day-frame) {
    box-shadow: inset 0 0 20px color-mix(in srgb, var(--color-category-main) 20%, transparent);
  }
  :deep(.fc-day-today .fc-daygrid-day-number) {
    font-weight: bold;
    color: var(--color-category-main);
  }

  /* セルのホバーエフェクト */
  :deep(.fc-daygrid-day-frame) {
    transition: background-color 0.2s ease, box-shadow 0.2s ease;
  }
  :deep(.fc-daygrid-day-frame:hover:not(:has(.fc-daygrid-event:hover))) {
    box-shadow: inset 0 0 var(--blur-lg) color-mix(in srgb, var(--color-category-main) 20%, transparent), 
                inset 0 0 0 1px color-mix(in srgb, var(--color-category-main) 50%, transparent);
  }

  /* イベントの装飾 */
  :deep(.fc-daygrid-event) {
    padding: 2px var(--space-1);
    background-color: color-mix(in srgb, var(--color-primary) 20%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-primary) 50%, transparent);
    color: var(--color-text-main);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  :deep(.fc-daygrid-event:hover) {
    box-shadow: inset 0 0 var(--blur-lg) color-mix(in srgb, var(--color-primary) 50%, transparent), 
                0 0 var(--blur-lg) color-mix(in srgb, var(--color-primary) 30%, transparent);
    border-color: var(--color-primary);
  }
  :deep(.fc-daygrid-event .fc-event-main) {
    font-weight: 500;
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
