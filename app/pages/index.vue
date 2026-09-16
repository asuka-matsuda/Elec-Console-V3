<script setup lang="ts">
/**
 * Dashboard
 * ダッシュボード画面のコンポーネントです。各機能へのリンクやメニューをカード形式で一覧表示します。
 */
import { useLocalStorage } from '@vueuse/core'
import { computed } from 'vue'

import { useAuth } from '~/composables/useAuth'
import { menuData } from '~/constants/data/menuData'
import type { DashboardData } from '~/types/components'

const { currentUser, isAuthenticated, isMaster } = useAuth()

const dashboardSections = computed(() => {
  return menuData
    .filter(section => section.showInDashboard)
    .map(section => ({
      ...section,
      items: section.items.filter(item => !item.masterOnly || isMaster.value),
    }))
})

const { data: dashboardData, pending: isDashboardPending } = await useFetch<DashboardData>('/api/dashboard', {
  lazy: true,
  default: () => ({ announcements: [], history: [] }),
})

const lastSiteId = useLocalStorage('last-accessed-site', '')

const getDynamicTo = (item: Record<string, unknown>) => {
  if (getDynamicDisabled(item)) return undefined

  if (
    (item.href === '/portal' || item.href === '/login')
    && isAuthenticated.value
  ) {
    const siteIds = currentUser.value?.assignedSiteIds || []

    if (siteIds.length > 0) {
      const targetSiteId = siteIds.includes(lastSiteId.value)
        ? lastSiteId.value
        : siteIds[0]

      return `/portal/${targetSiteId}`
    }
  }

  return item.href as string
}

const getDynamicDisabled = (item: Record<string, unknown>) => {
  if (item.disabled) return true
  if (item.href === '/portal' || item.href === '/login') {
    // ログイン済みかつアサイン現場が0件の場合はグレーアウト
    if (
      isAuthenticated.value
      && (!currentUser.value?.assignedSiteIds
        || currentUser.value.assignedSiteIds.length === 0)
    ) {
      return true
    }
  }

  return false
}

const getDynamicDesc = (item: Record<string, unknown>): string => {
  if (
    (item.href === '/portal' || item.href === '/login')
    && isAuthenticated.value
  ) {
    const siteIds = currentUser.value?.assignedSiteIds || []

    if (siteIds.length === 0) return 'アサインされている現場がありません'

    return `アサイン済みの現場ポータルへアクセスします（現在${siteIds.length}件）`
  }

  return (typeof item.desc === 'string' ? item.desc : '') || '※準備中…'
}
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
        <MoleculesSectionHeader :title="section.heading" :icon="section.icon" />

        <div class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-panel-gap">
          <MoleculesDashboardMenuTile
            v-for="item in section.items"
            :key="item.text"
            :to="getDynamicTo(item)"
            :disabled="getDynamicDisabled(item)"
            :title="item.text"
            :icon="item.icon"
            :description="getDynamicDesc(item)"
          />
        </div>
      </section>
    </div>

    <aside class="w-full md:w-sidebar-w md:sticky md:top-layout-pad md:overflow-y-auto shrink-0 md:max-h-[calc(100dvh-var(--space-layout-pad)*2)]">
      <div class="flex flex-col gap-section-gap">
        <section class="flex flex-col gap-panel-gap">
          <MoleculesSectionHeader title="お知らせ" icon="bell" size="md" />
          <MoleculesInfoCard
            :items="dashboardData?.announcements"
            :pending="isDashboardPending"
            loading-text="お知らせを読み込み中..."
            empty-text="現在新しいお知らせはありません"
          />
        </section>

        <section class="flex flex-col gap-panel-gap">
          <MoleculesSectionHeader title="更新履歴" icon="clock" size="md" />
          <MoleculesInfoCard
            :items="dashboardData?.history"
            :pending="isDashboardPending"
            loading-text="更新履歴を読み込み中..."
            empty-text="現在更新履歴はありません"
          >
            <template #badge="{ item }">
              <Badge
                v-if="item.version"
                :id="item.status === 'success' ? 'version:release' : 'version:muted'"
                class="shrink-0"
              >
                {{ item.version }}
              </Badge>
            </template>
          </MoleculesInfoCard>
        </section>
      </div>
    </aside>
  </div>
</template>
