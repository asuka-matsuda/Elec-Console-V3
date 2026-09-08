<script setup lang="ts">
/**
 * Dashboard
 * ダッシュボード画面のコンポーネントです。各機能へのリンクやメニューをカード形式で一覧表示します。
 */
import { useLocalStorage } from '@vueuse/core'

import { useAuth } from '~/composables/useAuth'
import { menuData } from '~/constants/data/menuData'
import type { DashboardData } from '~/types/components'

const dashboardSections = menuData.filter(section => section.showInDashboard)

const { data: dashboardData, pending: isDashboardPending } = await useFetch<DashboardData>('/api/dashboard', {
  lazy: true,
  default: () => ({ announcements: [], history: [] }),
})

const { currentUser, isAuthenticated } = useAuth()
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
  <div class="dashboard">
    <div class="dashboard-main">
      <section
        v-for="section in dashboardSections"
        :key="section.heading"
        class="dashboard-section"
        :style="`--theme-accent: var(--color-category-${section.accent || 'main'})`"
      >
        <MoleculesSectionHeader :title="section.heading" :icon="section.icon" />

        <div class="menu-grid">
          <MoleculesMenuTile
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

    <aside class="dashboard-aside">
      <AppInfoAside
        :announcements="dashboardData?.announcements"
        :history="dashboardData?.history"
        :pending="isDashboardPending"
      />
    </aside>
  </div>
</template>

<style scoped lang="scss">
.dashboard {
  display: flex;
  gap: var(--space-section-gap);
  align-items: flex-start;

  @include cq("md") {
    flex-direction: column;
  }

  &-main {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: var(--space-section-gap);
  }

  &-aside {
    position: sticky;
    top: var(--space-layout-pad);

    overflow-y: auto;
    flex-shrink: 0;

    width: var(--sidebar-width);
    max-height: calc(100dvh - var(--space-layout-pad) * 2);

    @include mq("md") {
      position: static;
      overflow-y: visible;
      width: 100%;
      max-height: none;
    }
  }

  &-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-panel-gap);
  }
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-panel-gap);
}
</style>
