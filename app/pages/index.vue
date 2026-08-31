<script setup lang="ts">
/**
 * Dashboard
 * ダッシュボード画面のコンポーネントです。各機能へのリンクやメニューをカード形式で一覧表示します。
 */
import { menuData } from "~/constants/data/menuData";
import { useAuth } from "~/composables/useAuth";
import { useLocalStorage } from "@vueuse/core";

/** Extract just the sections to show on the dashboard */
const dashboardSections = menuData.filter((section) => section.showInDashboard);

const { currentUser, isAuthenticated } = useAuth();
const lastSiteId = useLocalStorage("last-accessed-site", "");

const getDynamicTo = (item: Record<string, unknown>) => {
  if (getDynamicDisabled(item)) return undefined;
  
  if ((item.href === "/portal" || item.href === "/login") && isAuthenticated.value) {
    const siteIds = currentUser.value?.assignedSiteIds || [];
    if (siteIds.length > 0) {
      const targetSiteId = siteIds.includes(lastSiteId.value) ? lastSiteId.value : siteIds[0];
      return `/portal/${targetSiteId}`;
    }
  }
  
  return item.href as string;
};

const getDynamicDisabled = (item: Record<string, unknown>) => {
  if (item.disabled) return true;
  if (item.href === "/portal" || item.href === "/login") {
    // ログイン済みかつアサイン現場が0件の場合はグレーアウト
    if (isAuthenticated.value && (!currentUser.value?.assignedSiteIds || currentUser.value.assignedSiteIds.length === 0)) {
      return true;
    }
  }
  return false;
};

const getDynamicDesc = (item: Record<string, unknown>) => {
  if ((item.href === "/portal" || item.href === "/login") && isAuthenticated.value) {
    const siteIds = currentUser.value?.assignedSiteIds || [];
    if (siteIds.length === 0) return "アサインされている現場がありません";
    return `アサイン済みの現場ポータルへアクセスします（現在${siteIds.length}件）`;
  }
  return item.desc || "※準備中…";
};
</script>

<template>
  <div class="p-dashboard">
    <!-- Left Column: Menu Cards -->
    <div class="p-dashboard__main">
      <section
        v-for="section in dashboardSections"
        :key="section.heading"
        class="p-dashboard__section"
        :style="`--theme-accent: var(--color-category-${section.accent || 'main'})`"
      >
        <AppSectionHeader
          :title="section.heading"
          :icon="section.icon"
        />

        <div class="p-dashboard__grid">
          <AppCard
            v-for="item in section.items"
            :key="item.text"
            :to="getDynamicTo(item)"
            :disabled="getDynamicDisabled(item)"
          >
            <div class="p-dashboard-card__layout">
              <div class="p-dashboard-card__header">
                <AppIcon :name="item.icon" />
                <span>{{ item.text }}</span>
              </div>
              <div class="p-dashboard-card__desc">
                {{ getDynamicDesc(item) }}
              </div>
            </div>
          </AppCard>
        </div>
      </section>
    </div>

    <LayoutAside />
  </div>
</template>

<style scoped lang="scss">
.p-dashboard {
  display: flex;
  flex-direction: row; /* Desktop default */
  gap: var(--space-section-gap);
  align-items: flex-start;

  padding-bottom: var(--space-layout-pad);

  @include mq("md") {
    flex-direction: column;
    align-items: stretch;
  }

  &__main {
    @include flex-column(var(--space-section-gap));

    flex: 1;
  }

  &__section {
    @include flex-column;
  }

  &__grid {
    @include grid-auto(280px, var(--space-card-gap));
  }
}

/* Inner Card Styles */
.p-dashboard-card {
  &__layout {
    @include flex-column(var(--space-1));
  }

  &__header {
    @include text-title("sm");

    display: flex;
    gap: var(--space-inline-gap-sm);
    align-items: flex-start;

    color: var(--theme-accent);
    word-break: keep-all;
    line-break: strict;
    overflow-wrap: anywhere;
  }

  &__desc {
    @include text-desc;
  }
}
</style>
