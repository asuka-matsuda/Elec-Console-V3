<script setup lang="ts">
import { ref } from 'vue';
import { useHead } from '#app';
import AppPanel from '~/components/ui/AppPanel.vue';
import AppTable from '~/components/ui/AppTable.vue';
import AppBadge from '~/components/ui/AppBadge.vue';

useHead({
  title: '完了済みTODO - Elec-Console'
});

const headers = [
  { key: 'title', label: 'TODO内容' },
  { key: 'location', label: '場所' },
  { key: 'worker', label: '担当者' },
  { key: 'status', label: 'ステータス' },
  { key: 'completed_at', label: '完了日時' },
];

const todos = ref([
  { id: 1, title: '1F 分電盤 結線確認', location: '1F 事務室', worker: '山田太郎', completed_at: '2026-08-25T10:00:00Z' },
  { id: 2, title: '2F 照明器具 取付', location: '2F 会議室', worker: '鈴木一郎', completed_at: '2026-08-24T15:30:00Z' },
  { id: 3, title: '屋上 キュービクル清掃', location: '屋上', worker: '佐藤次郎', completed_at: '2026-08-23T09:15:00Z' },
]);
</script>

<template>
  <div class="p-portal-todos">
    <AppPanel heading="完了済みTODO" icon="check-square">
      <AppTable :columns="headers" :data="todos">
        <template #cell-status>
          <AppBadge variant="success">完了</AppBadge>
        </template>
        <template #cell-completed_at="{ value }">
          {{ new Date(value as string).toLocaleString('ja-JP') }}
        </template>
      </AppTable>
    </AppPanel>
  </div>
</template>