<script setup lang="ts">
/**
 * OrganismsSiteListMaster
 * [Portal Organisms] 現場管理の左ペイン（Master）。
 * 現場プロジェクト一覧、検索フィルター、ステータス絞り込み、新規現場作成トリガーを一元提供します。
 */
import { computed, ref } from 'vue'

import type { Site, SiteStatus } from '~/types/admin'
import type { RadioOption } from '~/types/components'

const props = defineProps<{
  sites: Site[]
  selectedSiteId: string | null
}>()

const emit = defineEmits<{
  (e: 'select' | 'toggle-disable', site: Site): void
  (e: 'create'): void
}>()

const searchQuery = ref('')
const statusFilter = ref<string>('all')

const filterOptions: RadioOption<string>[] = [
  { label: 'すべて', value: 'all' },
  { label: '進行中', value: 'in_progress' },
  { label: '計画中', value: 'planning' },
  { label: '完了', value: 'completed' },
]

const filteredSites = computed(() => {
  return props.sites.filter((s) => {
    // ステータス絞り込み
    if (statusFilter.value !== 'all' && s.status !== (statusFilter.value as SiteStatus)) {
      return false
    }

    // 検索語句絞り込み
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim().toLowerCase()
      const matchName = s.name.toLowerCase().includes(q)
      const matchId = s.id.toLowerCase().includes(q)

      if (!matchName && !matchId) return false
    }

    return true
  })
})
</script>

<template>
  <div class="flex flex-col gap-3 w-full">
    <!-- ヘッダー: タイトル & 新規登録ボタン (SectionHeader) -->
    <SectionHeader
      title="現場プロジェクト"
      icon="building"
      tag="h3"
    >
      <template #actions>
        <Button
          icon="plus"
          @click="emit('create')"
        >
          新規登録
        </Button>
      </template>
    </SectionHeader>

    <!-- 検索バー -->
    <Input
      v-model="searchQuery"
      placeholder="現場名・IDで検索..."
    />

    <!-- ステータスフィルター (RadioGroup) -->
    <div class="overflow-x-auto pb-1">
      <RadioGroup
        v-model="statusFilter"
        :options="filterOptions"
      />
    </div>

    <!-- 現場一覧リスト -->
    <div class="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-280px)] min-h-[300px]">
      <template v-if="filteredSites.length > 0">
        <PortalMoleculesSiteListItem
          v-for="site in filteredSites"
          :key="site.id"
          :site="site"
          :is-selected="site.id === selectedSiteId"
          @select="emit('select', $event)"
          @toggle-disable="emit('toggle-disable', $event)"
        />
      </template>

      <EmptyState
        v-else
        icon="search"
        title="該当する現場がありません"
        description="検索条件を変更するか、新規現場を登録してください。"
      />
    </div>
  </div>
</template>
