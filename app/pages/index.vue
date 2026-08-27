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
const router = useRouter();
const lastSiteId = useLocalStorage("last-accessed-site", "");

const _getDynamicTo = (item: Record<string, unknown>) => {
  if (_getDynamicDisabled(item)) return undefined;
  
  if (item.href === "/login" && isAuthenticated.value) {
    const siteIds = currentUser.value?.assignedSiteIds || [];
    if (siteIds.length > 0) {
      const targetSiteId = siteIds.includes(lastSiteId.value) ? lastSiteId.value : siteIds[0];
      return `/portal/${targetSiteId}`;
    }
  }
  
  return item.href as string;
};

const _getDynamicDisabled = (item: Record<string, unknown>) => {
  if (item.disabled) return true;
  if (item.href === "/login") {
    // ログイン済みかつアサイン現場が0件の場合はグレーアウト
    if (isAuthenticated.value && (!currentUser.value?.assignedSiteIds || currentUser.value.assignedSiteIds.length === 0)) {
      return true;
    }
  }
  return false;
};

const getDynamicDesc = (item: Record<string, unknown>) => {
  if (item.href === "/login" && isAuthenticated.value) {
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
      >
        <AppSectionHeader
          :title="section.heading"
          :icon="section.icon"
          :variant="section.accent || 'main'"
        />

        <div class="p-dashboard__grid">
          <AppCard
            v-for="item in section.items"
            :key="item.text"
            :variant="section.accent"
            :to="_getDynamicTo(item)"
            :disabled="_getDynamicDisabled(item)"
          >
            <div class="p-dashboard-card__layout">
              <div
                class="p-dashboard-card__header"
                :style="`--card-accent: var(--color-category-${section.accent})`"
              >
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
  // --- レイアウト・配置 ---
  display: flex;
  flex-direction: row; /* Desktop default */
  gap: var(--gap-section);
  align-items: flex-start;

  // --- ボックスモデル ---
  padding-bottom: var(--gap-section);

  @include mq("md") {
    // --- レイアウト・配置 ---
    flex-direction: column;
    align-items: stretch;
  }

  // --- 子要素 ---
  &__main {
    // --- レイアウト・配置 ---
    @include flex-column(var(--gap-section));

    flex: 1;
  }

  &__section {
    // --- レイアウト・配置 ---
    @include flex-column;
  }

  &__grid {
    // --- レイアウト・配置 ---
    @include grid-auto(280px);
  }
}

/* Inner Card Styles */
.p-dashboard-card {
  // --- 子要素 ---
  &__layout {
    // --- レイアウト・配置 ---
    @include flex-column(var(--gap-element));
  }

  &__header {
    // --- 継承 ---
    @extend %text-title-sm;

    // --- レイアウト・配置 ---
    display: flex;
    gap: var(--gap-element);
    align-items: flex-start;

    // --- タイポグラフィ ---
    color: var(--card-accent, var(--color-text-main));
    word-break: keep-all;
    line-break: strict;
    overflow-wrap: anywhere;
  }

  &__desc {
    // --- 継承 ---
    @extend %text-desc;
  }
}
</style>

