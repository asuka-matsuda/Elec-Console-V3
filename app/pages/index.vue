<script setup lang="ts">
/**
 * Dashboard
 * ダッシュボード画面のコンポーネントです。各機能へのリンクやメニューをカード形式で一覧表示します。
 */
import { useLocalStorage } from '@vueuse/core'

import { useAuth } from '~/composables/useAuth'
import { menuData } from '~/constants/data/menuData'

const dashboardSections = menuData.filter(section => section.showInDashboard)

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
  <div class="p-dashboard">
    <div class="p-dashboard__main">
      <section
        v-for="section in dashboardSections"
        :key="section.heading"
        class="p-dashboard__section"
        :style="`--theme-accent: var(--color-category-${section.accent || 'main'})`"
      >
        <AppSectionHeader :title="section.heading" :icon="section.icon" />

        <div class="p-dashboard__grid">
          <AppCard
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

    <DashboardAside />
  </div>
</template>

<style scoped lang="scss">
.p-dashboard {
  @include flex-start-start;

  gap: var(--space-section-gap);

  @include cq("md") {
    @include flex-start-stretch(column);
  }

  &__main {
    @include flex-start-stretch($direction: column);

    flex: 1;
    gap: var(--space-section-gap);
  }

  &__section {
    @include flex-start-stretch($direction: column);

    gap: var(--space-card-gap);
  }

  &__grid {
    @include grid-auto(280px, var(--space-card-gap));
  }
}
</style>
