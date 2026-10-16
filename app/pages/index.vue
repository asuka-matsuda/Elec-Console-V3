<script setup lang="ts">
/**
 * ダッシュボード画面
 * ダッシュボード画面のコンポーネントです。各機能へのリンクやメニューをパネル形式で一覧表示します。
 */
import { computed, ref } from 'vue'

import type { AnnouncementItem, DashboardData, HistoryItem } from '#shared/types/master'
import { useAuth } from '~/composables/useAuth'
import { menuData } from '~/constants/data/menuData'
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

const latestAnnouncements = computed(() => dashboardData.value?.announcements?.slice(0, 2) || [])
const olderAnnouncements = computed(() => dashboardData.value?.announcements?.slice(2) || [])
const latestHistory = computed(() => dashboardData.value?.history?.slice(0, 2) || [])
const olderHistory = computed(() => dashboardData.value?.history?.slice(2) || [])

// 3. 詳細モーダル（単一の参照オブジェクトに集約）
type DetailType = 'announcement' | 'history'
const activeDetail = ref<{ item: AnnouncementItem | HistoryItem, type: DetailType } | null>(null)
</script>

<template>
  <div class="flex flex-col md:flex-row gap-section-gap items-start">
    <section class="flex flex-1 flex-col gap-section-gap w-full min-w-0">
      <section v-for="section in dashboardSections" :key="section.heading" class="flex flex-col gap-panel-gap" :style="`--theme-accent: var(--color-category-${section.accent || 'main'})`">
        <header>
          <h2 class="flex items-center gap-item-gap">
            <Icon v-if="section.icon" :name="section.icon" variant="accent" />
            <span>{{ section.heading }}</span>
          </h2>
        </header>
        <hr class="divider is-accent">

        <ul class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-panel-gap">
          <li v-for="item in section.items" :key="item.text" class="flex">
            <NuxtLink :to="item.href" class="panel is-interactive flex flex-col gap-panel-gap h-full w-full">
              <header v-if="item.icon || item.text || item.version" class="flex items-center gap-item-gap min-w-0">
                <Icon v-if="item.icon" :name="item.icon" variant="accent" />
                <strong v-if="item.text" class="flex-1 min-w-0">{{ item.text }}</strong>
                <Badge v-if="item.version" variant="gray" class="shrink-0 ml-auto">{{ item.version }}</Badge>
              </header>

              <p v-if="item.desc">
                <small>{{ item.desc }}</small>
              </p>
            </NuxtLink>
          </li>
        </ul>
      </section>
    </section>

    <aside class="flex flex-col gap-section-gap w-full md:w-sidebar-w md:sticky md:top-layout-pad md:overflow-y-auto shrink-0 md:max-h-[calc(100dvh-var(--space-layout-pad)*2)]">
      <!-- お知らせセクション -->
      <section class="flex flex-col gap-panel-gap">
        <header>
          <h3 class="flex items-center gap-item-gap">
            <Icon name="bell" variant="accent" />
            <span>お知らせ</span>
          </h3>
        </header>
        <hr class="divider">

        <div v-if="isDashboardPending" class="flex flex-col gap-item-gap">
          <div v-for="skeletonIndex in 2" :key="`announcement-skeleton-${skeletonIndex}`" class="panel p-panel-pad-compact flex flex-col gap-inline-gap">
            <Skeleton width="5rem" height="0.85rem" />
            <Skeleton width="85%" height="1.1rem" />
          </div>
        </div>
        <EmptyState v-else-if="!dashboardData?.announcements?.length" icon="inbox" title="現在新しいお知らせはありません" />
        <div v-else class="flex flex-col gap-item-gap">
          <ul class="flex flex-col gap-item-gap">
            <li v-for="(item, index) in latestAnnouncements" :key="item.id ?? index">
              <button type="button" class="panel is-interactive p-panel-pad-compact w-full flex flex-col gap-inline-gap text-left" @click="activeDetail = { item, type: 'announcement' }">
                <div class="flex items-center justify-between gap-item-gap w-full">
                  <time>{{ formatDate(item.date) }}</time>
                </div>
                <strong>{{ item.title }}</strong>
              </button>
            </li>
          </ul>

          <Collapse v-if="olderAnnouncements.length > 0" :title="`過去のお知らせ (${olderAnnouncements.length}件)`" icon="history" card>
            <ul class="flex flex-col gap-item-gap max-h-[220px] overflow-y-auto">
              <li v-for="(item, index) in olderAnnouncements" :key="item.id ?? index">
                <button type="button" class="panel is-interactive p-panel-pad-compact w-full flex flex-col gap-inline-gap text-left" @click="activeDetail = { item, type: 'announcement' }">
                  <div class="flex items-center justify-between gap-item-gap w-full">
                    <time>{{ formatDate(item.date) }}</time>
                  </div>
                  <strong>{{ item.title }}</strong>
                </button>
              </li>
            </ul>
          </Collapse>
        </div>
      </section>

      <!-- 更新履歴セクション -->
      <section class="flex flex-col gap-panel-gap">
        <header>
          <h3 class="flex items-center gap-item-gap">
            <Icon name="clock" variant="accent" />
            <span>更新履歴</span>
          </h3>
        </header>
        <hr class="divider">

        <div v-if="isDashboardPending" class="flex flex-col gap-item-gap">
          <div v-for="skeletonIndex in 2" :key="`history-skeleton-${skeletonIndex}`" class="panel p-panel-pad-compact flex flex-col gap-inline-gap">
            <div class="flex items-center justify-between gap-item-gap">
              <Skeleton width="5rem" height="0.85rem" />
              <Skeleton width="3rem" height="0.85rem" />
            </div>
            <Skeleton width="90%" height="1.1rem" />
          </div>
        </div>
        <EmptyState v-else-if="!dashboardData?.history?.length" icon="inbox" title="現在更新履歴はありません" />
        <div v-else class="flex flex-col gap-item-gap">
          <ul class="flex flex-col gap-item-gap">
            <li v-for="(item, index) in latestHistory" :key="item.id ?? index">
              <button type="button" class="panel is-interactive p-panel-pad-compact w-full flex flex-col gap-inline-gap text-left" @click="activeDetail = { item, type: 'history' }">
                <div class="flex items-center justify-between gap-item-gap w-full">
                  <time>{{ formatDate(item.date) }}</time>
                  <Badge v-if="item.version" size="sm" variant="gray" class="shrink-0">{{ item.version }}</Badge>
                </div>
                <strong>{{ item.title }}</strong>
              </button>
            </li>
          </ul>

          <Collapse v-if="olderHistory.length > 0" :title="`過去の更新履歴 (${olderHistory.length}件)`" icon="history" card>
            <ul class="flex flex-col gap-item-gap max-h-[220px] overflow-y-auto">
              <li v-for="(item, index) in olderHistory" :key="item.id ?? index">
                <button type="button" class="panel is-interactive p-panel-pad-compact w-full flex flex-col gap-inline-gap text-left" @click="activeDetail = { item, type: 'history' }">
                  <div class="flex items-center justify-between gap-item-gap w-full">
                    <time>{{ formatDate(item.date) }}</time>
                    <Badge v-if="item.version" size="sm" variant="gray" class="shrink-0">{{ item.version }}</Badge>
                  </div>
                  <strong>{{ item.title }}</strong>
                </button>
              </li>
            </ul>
          </Collapse>
        </div>
      </section>
    </aside>

    <Modal :model-value="Boolean(activeDetail)" :title="activeDetail?.type === 'announcement' ? 'お知らせ詳細' : '更新履歴詳細'" :icon="activeDetail?.type === 'announcement' ? 'bell' : 'clock'" close-text="閉じる" @update:model-value="!$event && (activeDetail = null)">
      <div v-if="activeDetail" class="flex flex-col gap-form-row-gap">
        <header class="flex items-center justify-between gap-item-gap">
          <time>{{ formatDate(activeDetail.item.date) }}</time>
          <Badge v-if="'version' in activeDetail.item && activeDetail.item.version" size="sm" variant="gray">{{ activeDetail.item.version }}</Badge>
        </header>
        <hr class="divider">

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
