<script setup lang="ts">
/**
 * Master Admin Page
 * ID:master ユーザー専用のシステム管理画面。
 * システム全体設定（改行禁止ワード設定・将来のお知らせ設定等）を集約します。
 */
import { ref } from 'vue'

import { useHead } from '#app'
import MasterWordBreakTab from '~/components/master/MasterWordBreakTab.vue'
import type { TabOption } from '~/types/components'

useHead({ title: 'マスター管理 - Elec-Console' })

definePageMeta({
  middleware: ['master'],
})

const activeTab = ref<'word-break' | 'announcements'>('word-break')

const MASTER_TABS: TabOption<'word-break' | 'announcements'>[] = [
  {
    label: '改行禁止ワード設定',
    value: 'word-break',
  },
  {
    label: 'お知らせ設定（準備中）',
    value: 'announcements',
    disabled: true,
  },
]
</script>

<template>
  <div class="flex flex-col gap-6 master-page">
    <MoleculesSectionHeader
      title="マスター管理"
      icon="sliders"
      variant="management"
    />

    <AtomsTabs
      v-model="activeTab"
      :options="MASTER_TABS"
    />

    <div class="flex-1 min-h-0 flex flex-col gap-[var(--space-card-gap)]">
      <MasterWordBreakTab v-if="activeTab === 'word-break'" />
      <MoleculesEmptyState
        v-else-if="activeTab === 'announcements'"
        icon="bell"
        title="お知らせ設定"
        description="お知らせ設定機能は順次公開予定です。"
        class="py-12"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.master-page {
  --theme-accent: var(--color-category-management, var(--color-accent-teal));
}
</style>
