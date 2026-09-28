<script setup lang="ts">
/**
 * バージョン更新履歴（リリースノート）画面
 * システム全体および各ツールの更新・改修履歴を一覧表示・フィルタリングします。
 */
import { computed, ref, watch } from 'vue'

import type { DashboardData, HistoryItem } from '#shared/types/master'
import { getAllMenuItems, getMenuItemMap } from '~/constants/data/menuData'
import type { SelectOption } from '~/types/components'
import { formatDate } from '~/utils/date'

useHead({
  title: 'バージョン更新履歴',
})

const route = useRoute()
const router = useRouter()

// 1. ダッシュボード更新履歴の取得
const { data: dashboardData, pending } = useFetch<DashboardData>('/api/dashboard', {
  default: () => ({ announcements: [], history: [] }),
})

// 2. ツール一覧マップとセレクトオプションの生成
const toolMap = computed(() => getMenuItemMap())
const menuItems = getAllMenuItems()

const toolOptions = computed<SelectOption<string>[]>(() => {
  const options: SelectOption<string>[] = [
    { label: 'すべての対象（全履歴）', value: 'all' },
    { label: 'システム全体', value: 'system' },
  ]

  for (const item of menuItems) {
    if (item.id && item.id !== 'home') {
      options.push({
        label: `${item.text} (${item.version || 'v1.0.0'})`,
        value: item.id,
      })
    }
  }

  return options
})

// 3. フィルター状態（URLクエリとの連動）
const initialTool = typeof route.query.tool === 'string' ? route.query.tool : 'all'
const selectedTool = ref<string>(initialTool)

watch(selectedTool, (newVal) => {
  router.replace({
    query: {
      ...route.query,
      tool: newVal === 'all' ? undefined : newVal,
    },
  })
})

// 4. 絞り込み後の履歴リスト
const filteredHistory = computed<HistoryItem[]>(() => {
  const list = dashboardData.value?.history || []

  if (selectedTool.value === 'all') return list

  if (selectedTool.value === 'system') {
    return list.filter(item => !item.toolId || item.toolId === 'system')
  }

  return list.filter(item => item.toolId === selectedTool.value)
})

const resolveToolInfo = (toolId?: string) => {
  if (!toolId || toolId === 'system') {
    return { name: 'システム全体', icon: 'sliders' as const }
  }

  const tool = toolMap.value.get(toolId)

  if (tool) {
    return { name: tool.text, icon: tool.icon }
  }

  return { name: toolId, icon: 'info' as const }
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-section-gap w-full max-w-[1200px] mx-auto min-h-0">
    <SectionHeader
      title="バージョン更新履歴"
      icon="clock"
      variant="hud"
    >
      <template #actions>
        <Button
          icon="arrow-left"
          to="/"
        >
          ダッシュボードへ戻る
        </Button>
      </template>
    </SectionHeader>

    <Panel class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-panel-gap">
      <div class="flex items-center gap-item-gap filter-label">
        <Icon name="filter" class="shrink-0" />
        <span>対象ツール・機能:</span>
      </div>

      <div class="w-full sm:w-80">
        <Select
          v-model="selectedTool"
          :options="toolOptions"
        />
      </div>
    </Panel>

    <div v-if="pending" class="flex justify-center empty-wrapper">
      <EmptyState
        icon="clock"
        spin
        title="更新履歴を読み込み中..."
      />
    </div>

    <div v-else-if="filteredHistory.length > 0" class="flex flex-col gap-panel-gap">
      <Panel
        v-for="item in filteredHistory"
        :key="item.id || `${item.version}-${item.date}`"
        class="flex flex-col gap-item-gap"
      >
        <div class="flex flex-wrap items-center justify-between gap-item-gap history-header">
          <div class="flex items-center gap-item-gap">
            <small class="version-tag">
              {{ item.version }}
            </small>

            <span class="flex items-center gap-inline-gap tool-tag">
              <Icon :name="resolveToolInfo(item.toolId).icon" size="sm" />
              <span>{{ resolveToolInfo(item.toolId).name }}</span>
            </span>
          </div>

          <time class="history-date">
            {{ formatDate(item.date) }}
          </time>
        </div>

        <h3 class="m-0 history-title">
          {{ item.title }}
        </h3>

        <div v-if="item.desc" class="m-0 history-desc">
          {{ item.desc }}
        </div>
      </Panel>
    </div>

    <Panel v-else>
      <EmptyState
        icon="clock"
        title="該当する更新履歴はありません"
        description="選択されたツールの履歴はまだ登録されていません。"
      />
    </Panel>
  </div>
</template>

<style scoped lang="scss">
.filter-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-secondary);
}

.empty-wrapper {
  padding: var(--space-layout-pad) 0;
}

.history-header {
  padding-bottom: var(--space-inline-gap);
  border-bottom: var(--border-width-base) solid var(--color-border);
}

.tool-tag {
  padding: var(--space-inline-gap) var(--space-item-gap);

  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-secondary);

  background-color: var(--surface-bg);
}

.history-date {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.history-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--theme-accent);
}

.history-desc {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-base);
  color: var(--color-text-secondary);
  white-space: pre-line;
}

.version-tag {
  font-family: var(--font-mono);
  color: var(--color-text-muted);
}
</style>
