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
  // --- Base Styles ---
  display: flex;
  flex-direction: row; /* Desktop default */
  gap: var(--gap-section);
  align-items: flex-start;

  padding-bottom: var(--gap-section);

  @include mq("md") {
    flex-direction: column;
    align-items: stretch;
  }

  &__main {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: var(--gap-section);
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: var(--gap-component);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--gap-component);
  }
}

/* Inner Card Styles */
.p-dashboard-card {
  &__layout {
    display: flex;
    flex-direction: column;
    gap: var(--gap-element);
  }

  &__header {

    @extend %text-base;

    display: flex;
    gap: var(--gap-element);
    align-items: flex-start;

    font-weight: var(--font-weight-bold);
    color: var(--card-accent, var(--color-text-main));
    word-break: keep-all;
    line-break: strict;
    overflow-wrap: anywhere;
  }

  &__desc {
    @extend %text-sm;

    color: var(--color-text-muted);
  }
}
</style>
