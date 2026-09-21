<script setup lang="ts">
/**
 * SiteListMaster
 * [Portal Organisms] 現場管理の左ペイン（Master）。
 * 現場一覧、検索、ステータス絞り込み、新規現場作成トリガーを提供します。
 */
import { computed, ref } from 'vue'

import type { Site, SiteStatus } from '~/types/admin'
import type { RadioOption } from '~/types/components'

type StatusFilterType = 'all' | SiteStatus

const props = defineProps<{
  sites: Site[]
  selectedSiteId: string | null
}>()

const emit = defineEmits<{
  'select': [site: Site]
  'toggle-disable': [site: Site]
  'create': []
}>()

const searchQuery = ref('')
const statusFilter = ref<StatusFilterType>('all')

const filterOptions: RadioOption<StatusFilterType>[] = [
  { label: 'すべて', value: 'all' },
  { label: '進行中', value: 'in_progress' },
  { label: '計画中', value: 'planning' },
  { label: '完了', value: 'completed' },
]

const filteredSites = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const filter = statusFilter.value

  return props.sites.filter((site) => {
    // 1. ステータス絞り込み
    if (filter !== 'all' && site.status !== filter) {
      return false
    }

    // 2. 検索語句絞り込み
    if (query) {
      const matchName = site.name?.toLowerCase().includes(query)
      const matchId = site.id?.toLowerCase().includes(query)

      if (!matchName && !matchId) return false
    }

    return true
  })
})
</script>

<template>
  <div class="flex flex-col gap-3 w-full">
    <!-- ヘッダー: タイトル & 新規登録ボタン -->
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

    <!-- ステータスフィルター (block指定で均等配置、不要なラッパーdivを排除) -->
    <RadioGroup
      v-model="statusFilter"
      :options="filterOptions"
      block
    />

    <!-- 現場一覧リスト (不要な template v-if ラッパーを排除) -->
    <div class="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-280px)] min-h-[300px]">
      <PortalSiteListItem
        v-for="site in filteredSites"
        :key="site.id"
        :site="site"
        :is-selected="site.id === selectedSiteId"
        @select="emit('select', $event)"
        @toggle-disable="emit('toggle-disable', $event)"
      />

      <EmptyState
        v-if="filteredSites.length === 0"
        icon="search"
        title="該当する現場がありません"
        description="検索条件を変更するか、新規現場を登録してください。"
      />
    </div>
  </div>
</template>
