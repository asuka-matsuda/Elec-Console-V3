<script setup lang="ts">
/**
 * ダッシュボード画面
 * ダッシュボード画面のコンポーネントです。各機能へのリンクやメニューをパネル形式で一覧表示します。
 */
import { computed, ref } from 'vue'

import { useAuth } from '~/composables/useAuth'
import { menuData } from '~/constants/data/menuData'
import type { AnnouncementItem, DashboardData, HistoryItem } from '~/types/components'

const { isMaster } = useAuth()

// 1. ダッシュボード表示対象メニューの抽出（現場解決・リダイレクト等は /portal へ委譲）
const dashboardSections = computed(() =>
  menuData
    .filter(section => section.showInDashboard)
    .map(section => ({
      ...section,
      items: section.items.filter(item => !item.masterOnly || isMaster.value),
    })),
)

// 2. お知らせ・更新履歴データ（await を外して初期描画ブロックを排除）
const { data: dashboardData, pending: isDashboardPending } = useFetch<DashboardData>('/api/dashboard', {
  default: () => ({ announcements: [], history: [] }),
})

// 3. 詳細モーダル（単一の参照オブジェクトに集約）
type DetailType = 'announcement' | 'history'
const activeDetail = ref<{ item: AnnouncementItem | HistoryItem, type: DetailType } | null>(null)
</script>

<template>
  <div class="flex flex-col md:flex-row gap-section-gap items-start">
    <div class="flex flex-1 flex-col gap-section-gap w-full min-w-0">
      <section
        v-for="section in dashboardSections"
        :key="section.heading"
        class="flex flex-col gap-panel-gap"
        :style="`--theme-accent: var(--color-category-${section.accent || 'main'})`"
      >
        <SectionHeader :title="section.heading" :icon="section.icon" />

        <div class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-panel-gap">
          <MenuTile
            v-for="item in section.items"
            :key="item.text"
            :item="item"
          />
        </div>
      </section>
    </div>

    <aside class="w-full md:w-sidebar-w md:sticky md:top-layout-pad md:overflow-y-auto shrink-0 md:max-h-[calc(100dvh-var(--space-layout-pad)*2)]">
      <div class="flex flex-col gap-section-gap">
        <section class="flex flex-col gap-panel-gap">
          <SectionHeader title="お知らせ" icon="bell" tag="h3" />
          <InfoList
            :items="dashboardData?.announcements"
            :pending="isDashboardPending"
            loading-text="お知らせを読み込み中..."
            empty-text="現在新しいお知らせはありません"
            @select="activeDetail = { item: $event, type: 'announcement' }"
          />
        </section>

        <section class="flex flex-col gap-panel-gap">
          <SectionHeader title="更新履歴" icon="clock" tag="h3" />
          <InfoList
            :items="dashboardData?.history"
            :pending="isDashboardPending"
            loading-text="更新履歴を読み込み中..."
            empty-text="現在更新履歴はありません"
            @select="activeDetail = { item: $event, type: 'history' }"
          >
            <template #badge="{ item }">
              <Badge
                v-if="item.version"
                id="version:muted"
                class="shrink-0"
              >
                {{ item.version }}
              </Badge>
            </template>
          </InfoList>
        </section>
      </div>
    </aside>

    <Modal
      :model-value="Boolean(activeDetail)"
      :title="activeDetail?.type === 'announcement' ? 'お知らせ詳細' : '更新履歴詳細'"
      :icon="activeDetail?.type === 'announcement' ? 'bell' : 'clock'"
      close-text="閉じる"
      @update:model-value="!$event && (activeDetail = null)"
    >
      <div v-if="activeDetail" class="flex flex-col gap-3">
        <header
          class="flex items-center justify-between gap-2 pb-2"
          style="border-bottom: 1px solid var(--color-border)"
        >
          <small style="font-family: var(--font-mono)">
            {{ activeDetail.item.date }}
          </small>
          <Badge
            v-if="'version' in activeDetail.item && activeDetail.item.version"
            id="version:muted"
          >
            {{ activeDetail.item.version }}
          </Badge>
        </header>

        <h4 class="m-0">
          {{ activeDetail.item.title }}
        </h4>

        <p class="m-0 whitespace-pre-wrap">
          {{ activeDetail.item.desc || '詳細情報はありません。' }}
        </p>
      </div>
    </Modal>
  </div>
</template>
