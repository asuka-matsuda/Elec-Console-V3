<script setup lang="ts">
import { ref } from 'vue';
import { useHead } from '#app';
import AppPanel from '~/components/ui/AppPanel.vue';
import AppTable from '~/components/ui/AppTable.vue';
import AppInput from '~/components/ui/AppInput.vue';
import AppButton from '~/components/ui/AppButton.vue';
import AppBadge from '~/components/ui/AppBadge.vue';

useHead({ title: '操作ログ - Elec-Console' });

const headers = [
  { key: 'timestamp', label: '日時' },
  { key: 'level', label: 'レベル' },
  { key: 'user', label: 'ユーザー' },
  { key: 'action', label: 'アクション' },
];

const logs = ref([
  { id: 1, timestamp: '2026-08-25T14:30:00Z', level: 'info', user: '山田太郎', action: 'Phase1 の結果を保存しました' },
  { id: 2, timestamp: '2026-08-25T14:35:00Z', level: 'warn', user: 'システム', action: 'バックアップが遅延しています' },
  { id: 3, timestamp: '2026-08-25T14:40:00Z', level: 'error', user: '鈴木一郎', action: '不正なログイン試行' },
]);
</script>

<template>
  <div class="p-portal-logs">
    <AppPanel heading="操作ログ" icon="list">
      <div class="p-portal-logs__filter">
        <AppInput placeholder="ユーザー名で検索..." class="p-portal-logs__search" />
        <AppButton variant="warning" icon="filter">絞り込み</AppButton>
      </div>

      <AppTable :columns="headers" :data="logs">
        <template #cell-timestamp="{ value }">
          <span class="p-portal-logs__time">{{ new Date(value as string).toLocaleString('ja-JP') }}</span>
        </template>
        <template #cell-level="{ value }">
          <AppBadge v-if="(value as string) === 'error'" variant="danger">ERROR</AppBadge>
          <AppBadge v-else-if="(value as string) === 'warn'" variant="warning">WARN</AppBadge>
          <AppBadge v-else variant="success">INFO</AppBadge>
        </template>
      </AppTable>
    </AppPanel>
  </div>
</template>

<style scoped lang="scss">
.p-portal-logs {
  &__filter {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  &__search {
    width: 16rem;
  }

  &__time {
    color: var(--color-text-muted, #6b7280);
    font-size: 0.875rem;
  }
}
</style>