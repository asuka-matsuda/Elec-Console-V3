<script setup lang="ts">
/**
 * Master Admin Page
 * ID:master ユーザー専用のシステム管理画面。
 * システム全体設定（改行禁止ワード設定・将来のお知らせ設定等）を集約します。
 */
import { ref } from 'vue'

import { useHead } from '#app'
import type { TabOption } from '~/types/components'

useHead({ title: 'マスター管理 - Elec-Console' })

definePageMeta({
  middleware: ['master'],
})

const activeTab = ref<'word-break' | 'announcements' | 'history'>('word-break')

const MASTER_TABS: TabOption<'word-break' | 'announcements' | 'history'>[] = [
  {
    label: '改行禁止ワード設定',
    value: 'word-break',
    icon: 'type',
  },
  {
    label: 'お知らせ設定',
    value: 'announcements',
    icon: 'bell',
  },
  {
    label: '更新履歴設定',
    value: 'history',
    icon: 'clock',
  },
]
</script>

<template>
  <div class="flex flex-col gap-section-gap">
    <Tabs
      v-model="activeTab"
      :options="MASTER_TABS"
      panel-class="flex flex-col gap-panel-gap"
    >
      <template #word-break>
        <MasterWordBreakTab />
      </template>

      <template #announcements>
        <MasterAnnouncementsTab />
      </template>

      <template #history>
        <MasterHistoryTab />
      </template>
    </Tabs>
  </div>
</template>
