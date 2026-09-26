<script setup lang="ts">
/**
 * MasterSiteList
 * [Portal Organisms] 現場管理の左ペイン（Master）。
 * 現場一覧、検索、ステータス絞り込み、新規現場作成トリガーを提供します。
 */
import { computed, ref } from 'vue'

import type { Site, SiteStatus } from '#shared/types/site'
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
  <div class="flex flex-col gap-panel-gap w-full flex-1 min-h-0">

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

    <Input
      v-model="searchQuery"
      placeholder="現場名・IDで検索..."
    />

    <RadioGroup
      v-model="statusFilter"
      :options="filterOptions"
      block
    />

    <ul class="flex flex-col gap-item-gap overflow-y-auto flex-1 min-h-[300px] list-none m-0 p-0">
      <Panel
        v-for="site in filteredSites"
        :key="site.id"
        as="li"
        interactive
        padding="compact"
        :disabled="Boolean(site.disabledAt)"
        :selected="site.id === selectedSiteId"
        class="flex items-center justify-between gap-panel-gap w-full"
        @click="emit('select', site)"
      >
        <div class="flex-1 min-w-0 flex flex-col gap-inline-gap">
          <div class="flex items-center gap-item-gap">
            <span>
              {{ site.name }}
            </span>
            <Badge :id="`site:${site.status}`" />
            <Badge v-if="site.disabledAt" id="site:disabled" />
          </div>
          <div>
            ID: {{ site.id }}
          </div>
        </div>

        <Button
          class="shrink-0"
          :variant="site.disabledAt ? 'success' : 'danger'"
          @click.stop="emit('toggle-disable', site)"
        >
          {{ site.disabledAt ? '有効化' : '無効化' }}
        </Button>
      </Panel>

      <EmptyState
        v-if="filteredSites.length === 0"
        icon="search"
        title="該当する現場がありません"
        description="検索条件を変更するか、新規現場を登録してください。"
      />
    </ul>
  </div>
</template>
