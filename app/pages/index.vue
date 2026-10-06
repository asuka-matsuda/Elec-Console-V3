<script setup lang="ts">
/**
 * ダッシュボード画面
 * ダッシュボード画面のコンポーネントです。各機能へのリンクやメニューをパネル形式で一覧表示します。
 */
import { computed, ref } from 'vue'

import { NuxtLink } from '#components'
import type { AnnouncementItem, DashboardData, HistoryItem } from '#shared/types/master'
import { useAuth } from '~/composables/useAuth'
import { menuData, type MenuItem } from '~/constants/data/menuData'
import type { BadgeVariant } from '~/types/components'
import { formatDate } from '~/utils/date'

const { isMaster, isAdmin } = useAuth()

// 1. ダッシュボード表示対象メニューの抽出（現場解決・リダイレクト等は /portal へ委譲）
const dashboardSections = computed(() =>
  menuData
    .filter(section => section.showInDashboard)
    .map(section => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.masterOnly && !isMaster.value) return false
        if (item.adminOnly && !isAdmin.value) return false

        return true
      }),
    }))
    .filter(section => section.items.length > 0),
)

// 2. お知らせ・更新履歴データ（await を外して初期描画ブロックを排除）
const { data: dashboardData, pending: isDashboardPending } = useFetch<DashboardData>('/api/dashboard', {
  default: () => ({ announcements: [], history: [] }),
})

// 3. 詳細モーダル（単一の参照オブジェクトに集約）
type DetailType = 'announcement' | 'history'
const activeDetail = ref<{ item: AnnouncementItem | HistoryItem, type: DetailType } | null>(null)

const resolveMenuBadge = (item: MenuItem): { text: string, variant: BadgeVariant } | null => {
  if (item.badge) {
    if (typeof item.badge === 'string') {
      return { text: item.badge, variant: 'gray' }
    }

    return {
      text: item.badge.text,
      variant: item.badge.variant ?? 'gray',
    }
  }
  if (item.version) {
    return { text: item.version, variant: 'gray' }
  }

  return null
}
</script>

<template>
  <div class="flex flex-col md:flex-row gap-section-gap items-start">
    <section class="flex flex-1 flex-col gap-section-gap w-full min-w-0">
      <section v-for="section in dashboardSections" :key="section.heading" class="flex flex-col gap-panel-gap" :style="`--theme-accent: var(--color-category-${section.accent || 'main'})`">
        <header>
          <h2 class="flex items-center gap-item-gap">
            <Icon v-if="section.icon" :name="section.icon" style="color: var(--theme-accent)" />
            <span>{{ section.heading }}</span>
          </h2>
        </header>
        <hr class="divider is-accent">

        <ul class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-panel-gap">
          <li v-for="item in section.items" :key="item.text" class="flex">
            <component :is="!item.disabled && item.href ? NuxtLink : 'div'" :to="!item.disabled && item.href ? item.href : undefined" :disabled="Boolean(item.disabled)" class="panel is-interactive flex flex-col gap-panel-gap h-full w-full">
              <header v-if="item.icon || item.text || resolveMenuBadge(item)" class="flex items-center gap-item-gap min-w-0">
                <Icon v-if="item.icon" :name="item.icon" class="tile-icon" />
                <span v-if="item.text" class="flex-1 min-w-0 tile-title">{{ item.text }}</span>
                <Badge v-if="resolveMenuBadge(item)" :variant="resolveMenuBadge(item)!.variant" class="shrink-0 ml-auto">{{ resolveMenuBadge(item)!.text }}</Badge>
              </header>

              <p v-if="item.desc" class="tile-desc">
                {{ item.desc }}
              </p>
            </component>
          </li>
        </ul>
      </section>
    </section>

    <aside class="flex flex-col gap-section-gap w-full md:w-sidebar-w md:sticky md:top-layout-pad md:overflow-y-auto shrink-0 md:max-h-[calc(100dvh-var(--space-layout-pad)*2)]">
      <section class="flex flex-col gap-panel-gap">
        <header>
          <h3 class="flex items-center gap-item-gap">
            <Icon name="bell" style="color: var(--theme-accent)" />
            <span>お知らせ</span>
          </h3>
        </header>
        <hr class="divider">

        <div v-if="isDashboardPending" class="flex flex-col gap-item-gap">
          <div v-for="skeletonIndex in 3" :key="`announcement-skeleton-${skeletonIndex}`" class="panel feed-card flex flex-col gap-inline-gap">
            <Skeleton width="5rem" height="0.85rem" />
            <Skeleton width="85%" height="1.1rem" />
          </div>
        </div>
        <EmptyState v-else-if="!dashboardData?.announcements?.length" icon="inbox" title="現在新しいお知らせはありません" />
        <ul v-else class="flex flex-col gap-item-gap">
          <li v-for="(item, index) in dashboardData.announcements" :key="item.id ?? index">
            <button type="button" class="panel is-interactive feed-card w-full flex flex-col gap-inline-gap text-left" @click="activeDetail = { item, type: 'announcement' }">
              <div class="flex items-center justify-between gap-item-gap w-full">
                <time>{{ formatDate(item.date) }}</time>
              </div>
              <span class="feed-title">{{ item.title }}</span>
            </button>
          </li>
        </ul>
      </section>

      <section class="flex flex-col gap-panel-gap">
        <header class="flex items-center justify-between gap-item-gap">
          <h3 class="flex items-center gap-item-gap">
            <Icon name="clock" style="color: var(--theme-accent)" />
            <span>更新履歴</span>
          </h3>
          <NuxtLink to="/changelog" class="flex items-center gap-inline-gap all-history-link">
            <span>全履歴</span>
            <Icon name="arrow-right" size="sm" />
          </NuxtLink>
        </header>
        <hr class="divider">

        <div v-if="isDashboardPending" class="flex flex-col gap-item-gap">
          <div v-for="skeletonIndex in 3" :key="`history-skeleton-${skeletonIndex}`" class="panel feed-card flex flex-col gap-inline-gap">
            <div class="flex items-center justify-between gap-item-gap">
              <Skeleton width="5rem" height="0.85rem" />
              <Skeleton width="3rem" height="0.85rem" />
            </div>
            <Skeleton width="90%" height="1.1rem" />
          </div>
        </div>
        <EmptyState v-else-if="!dashboardData?.history?.length" icon="inbox" title="現在更新履歴はありません" />
        <ul v-else class="flex flex-col gap-item-gap">
          <li v-for="(item, index) in dashboardData.history" :key="item.id ?? index">
            <button type="button" class="panel is-interactive feed-card w-full flex flex-col gap-inline-gap text-left" @click="activeDetail = { item, type: 'history' }">
              <div class="flex items-center justify-between gap-item-gap w-full">
                <time>{{ formatDate(item.date) }}</time>
                <Badge v-if="item.version" size="sm" variant="gray" class="shrink-0">{{ item.version }}</Badge>
              </div>
              <span class="feed-title">{{ item.title }}</span>
            </button>
          </li>
        </ul>
      </section>
    </aside>

    <Modal :model-value="Boolean(activeDetail)" :title="activeDetail?.type === 'announcement' ? 'お知らせ詳細' : '更新履歴詳細'" :icon="activeDetail?.type === 'announcement' ? 'bell' : 'clock'" close-text="閉じる" @update:model-value="!$event && (activeDetail = null)">
      <div v-if="activeDetail" class="flex flex-col gap-form-row-gap">
        <header class="flex items-center justify-between gap-item-gap pb-item-gap" style="border-bottom: 1px solid var(--color-border)">
          <small style="font-family: var(--font-mono)">{{ formatDate(activeDetail.item.date) }}</small>
          <Badge v-if="'version' in activeDetail.item && activeDetail.item.version" size="sm" variant="gray">{{ activeDetail.item.version }}</Badge>
        </header>

        <h4>
          {{ activeDetail.item.title }}
        </h4>

        <p class="whitespace-pre-wrap">
          {{ activeDetail.item.desc || '詳細情報はありません。' }}
        </p>
      </div>
    </Modal>
  </div>
</template>

<style scoped lang="scss">
.tile-icon {
  color: var(--theme-accent);
}

.tile-title {
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--theme-accent);
  letter-spacing: var(--tracking-wide);
}

.tile-desc {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-ui);
  color: var(--color-text-muted);
}

.feed-card {
  time {
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }

  .feed-title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    line-height: var(--line-height-tight);
    color: var(--color-text-main);
  }
}

.all-history-link {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  transition: var(--transition-base);

  &:hover {
    color: var(--theme-accent);
  }
}
</style>
