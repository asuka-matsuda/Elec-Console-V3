<script setup lang="ts">
/**
 * Dashboard
 * ダッシュボード画面のコンポーネントです。各機能へのリンクやメニューをカード形式で一覧表示します。
 */
import { menuData } from "~/utils/data/menuData";

/** Extract just the sections to show on the dashboard */
const dashboardSections = menuData.filter((section) => section.showInDashboard);
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
            :to="item.disabled ? undefined : item.href"
            :disabled="item.disabled"
          >
            <div class="p-dashboard-card__layout">
              <div
                class="p-dashboard-card__header"
                :style="`--card-accent: var(--color-category-${section.accent})`"
              >
                <AppIcon :name="item.icon" class="p-dashboard-card__icon" />
                <span>{{ item.text }}</span>
              </div>
              <div class="p-dashboard-card__desc">
                {{ item.desc || "※準備中…" }}
              </div>
            </div>
          </AppCard>
        </div>
      </section>
    </div>

    <AppDashboardAside />
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
    @include flex-column(var(--gap-component));
  }

  &__grid {
    // --- レイアウト・配置 ---
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--gap-component);
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
