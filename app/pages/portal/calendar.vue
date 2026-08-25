<script setup lang="ts">
import { useHead } from '#app';
import AppPanel from '~/components/ui/AppPanel.vue';
import AppButton from '~/components/ui/AppButton.vue';

useHead({
  title: '現場カレンダー - Elec-Console'
});
</script>

<template>
  <div class="p-portal-calendar">
    <AppPanel heading="現場カレンダー" icon="calendar">
      <div class="p-portal-calendar__header">
        <p class="p-portal-calendar__desc">※ FullCalendar を使用したスケジュール管理画面</p>
        <AppButton variant="primary" size="sm" icon="plus">予定を追加</AppButton>
      </div>

      <div class="p-portal-calendar__placeholder">
        <p>npm install @fullcalendar/vue3 @fullcalendar/core @fullcalendar/daygrid などをインストール後、<br>ここに FullCalendar コンポーネントを配置します。</p>
      </div>
    </AppPanel>
  </div>
</template>

<style scoped lang="scss">
.p-portal-calendar {
  &__header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1rem;
  }
  
  &__desc {
    color: var(--color-text-muted, #6b7280);
  }

  &__placeholder {
    background-color: #fff;
    padding: 1rem;
    border-radius: 4px;
    border: 1px solid var(--color-border, #e5e7eb);
    min-height: 500px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-muted, #9ca3af);
    text-align: center;
  }
}
</style>