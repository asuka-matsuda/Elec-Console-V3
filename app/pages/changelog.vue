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

// 5. アコーディオン展開状態（初期状態で先頭の最新リリースを展開）
const activeCollapseKeys = ref<(string | number)[]>([])

watch(
  filteredHistory,
  (list) => {
    const firstItem = list[0]

    if (firstItem && activeCollapseKeys.value.length === 0) {
      const firstId = firstItem.id || `${firstItem.version}-${firstItem.date}`

      activeCollapseKeys.value = [firstId]
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="flex flex-1 flex-col gap-section-gap w-full max-w-[1200px] mx-auto min-h-0">
    <header class="flex flex-col gap-item-gap shrink-0">
      <div class="flex items-center justify-between gap-item-gap flex-wrap">
        <h2 class="flex items-center gap-item-gap">
          <Icon name="clock" />
          <span>バージョン更新履歴</span>
        </h2>
        <Button variant="tertiary" size="sm" icon="arrow-left" to="/">ダッシュボードへ戻る</Button>
      </div>
      <hr class="divider">
    </header>

    <div class="panel flex flex-col sm:flex-row sm:items-center justify-between gap-panel-gap">
      <div class="flex items-center gap-item-gap filter-label">
        <Icon name="filter" />
        <span>対象ツール・機能:</span>
      </div>

      <div class="w-full sm:w-80">
        <Select v-model="selectedTool" :options="toolOptions" />
      </div>
    </div>

    <div v-if="pending" class="flex flex-col gap-panel-gap">
      <div v-for="skeletonIndex in 3" :key="`changelog-skeleton-${skeletonIndex}`" class="panel flex flex-col gap-item-gap">
        <div class="flex items-center justify-between gap-item-gap">
          <div class="flex items-center gap-item-gap">
            <Skeleton width="4rem" height="1.2rem" />
            <Skeleton width="6rem" height="1.2rem" />
          </div>
          <Skeleton width="5rem" height="1rem" />
        </div>
        <Skeleton width="60%" height="1.4rem" />
        <Skeleton width="90%" height="1rem" />
      </div>
    </div>

    <div v-else-if="filteredHistory.length > 0">
      <CollapseGroup v-model="activeCollapseKeys" card>
        <Collapse
          v-for="item in filteredHistory"
          :key="item.id || `${item.version}-${item.date}`"
          :value="item.id || `${item.version}-${item.date}`"
        >
          <template #title>
            <div class="flex items-center gap-inline-gap flex-wrap min-w-0">
              <Badge size="sm" variant="gray">{{ item.version }}</Badge>
              <Badge size="sm" variant="blue" :icon="resolveToolInfo(item.toolId).icon">{{ resolveToolInfo(item.toolId).name }}</Badge>
              <span class="history-title">{{ item.title }}</span>
            </div>
          </template>

          <template #extra>
            <time class="history-date">
              {{ formatDate(item.date) }}
            </time>
          </template>

          <div class="history-desc">
            {{ item.desc || '詳細情報はありません。' }}
          </div>
        </Collapse>
      </CollapseGroup>
    </div>

    <EmptyState v-else icon="clock" variant="no-results" title="該当する更新履歴はありません" description="選択されたツールの履歴はまだ登録されていません。" />
  </div>
</template>

<style scoped lang="scss">
.filter-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-secondary);
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
</style>
