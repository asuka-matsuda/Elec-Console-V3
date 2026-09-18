<script setup lang="ts">
/**
 * Dashboard
 * ダッシュボード画面のコンポーネントです。各機能へのリンクやメニューをカード形式で一覧表示します。
 */
import { useLocalStorage } from '@vueuse/core'
import { computed, ref } from 'vue'

import { useAuth } from '~/composables/useAuth'
import { menuData } from '~/constants/data/menuData'
import type { IconName } from '~/constants/icons'
import type { AnnouncementItem, DashboardData, HistoryItem } from '~/types/components'

const { currentUser, isAuthenticated, isMaster } = useAuth()

const lastSiteId = useLocalStorage('last-accessed-site', '')

type DetailModalItem = AnnouncementItem | HistoryItem
const selectedItem = ref<DetailModalItem | null>(null)
const isDetailModalOpen = ref(false)
const modalTitle = ref('')
const modalIcon = ref<IconName>('info')

const openDetailModal = (item: DetailModalItem, title: string, icon: IconName) => {
  selectedItem.value = item
  modalTitle.value = title
  modalIcon.value = icon
  isDetailModalOpen.value = true
}

const dashboardSections = computed(() => {
  const siteIds = currentUser.value?.assignedSiteIds || []
  const hasAssignedSites = siteIds.length > 0
  const targetSiteId = siteIds.includes(lastSiteId.value) ? lastSiteId.value : siteIds[0]

  return menuData
    .filter(section => section.showInDashboard)
    .map(section => ({
      ...section,
      items: section.items
        .filter(item => !item.masterOnly || isMaster.value)
        .map((item) => {
          if (
            (item.href === '/portal' || item.href === '/login')
            && isAuthenticated.value
          ) {
            if (!hasAssignedSites) {
              return {
                ...item,
                disabled: true,
                desc: 'アサインされている現場がありません',
              }
            }

            return {
              ...item,
              href: `/portal/${targetSiteId}`,
              desc: `アサイン済みの現場ポータルへアクセスします（現在${siteIds.length}件）`,
            }
          }

          return {
            ...item,
            desc: item.desc || '※準備中…',
          }
        }),
    }))
})

const { data: dashboardData, pending: isDashboardPending } = await useFetch<DashboardData>('/api/dashboard', {
  lazy: true,
  default: () => ({ announcements: [], history: [] }),
})
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
          <DashboardMenuTile
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
            @select="openDetailModal($event, 'お知らせ詳細', 'bell')"
          />
        </section>

        <section class="flex flex-col gap-panel-gap">
          <SectionHeader title="更新履歴" icon="clock" tag="h3" />
          <InfoList
            :items="dashboardData?.history"
            :pending="isDashboardPending"
            loading-text="更新履歴を読み込み中..."
            empty-text="現在更新履歴はありません"
            @select="openDetailModal($event, '更新履歴詳細', 'clock')"
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

    <!-- 詳細表示モーダル -->
    <Modal
      v-model="isDetailModalOpen"
      :title="modalTitle"
      :icon="modalIcon"
      close-text="閉じる"
    >
      <div v-if="selectedItem" class="flex flex-col gap-3 detail-content">
        <header class="flex items-center justify-between gap-2 pb-2 detail-header">
          <time class="detail-date">{{ selectedItem.date }}</time>
          <Badge
            v-if="'version' in selectedItem && selectedItem.version"
            id="version:muted"
          >
            {{ selectedItem.version }}
          </Badge>
        </header>

        <h4 class="m-0 detail-title">
          {{ selectedItem.title }}
        </h4>

        <div class="whitespace-pre-wrap detail-desc">
          {{ selectedItem.desc || '詳細情報はありません。' }}
        </div>
      </div>
    </Modal>
  </div>
</template>

<style scoped lang="scss">
.detail-header {
  border-bottom: 1px solid var(--color-border);
}

.detail-date {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.detail-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-main);
}

.detail-desc {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
  color: var(--color-text-secondary);
}
</style>
