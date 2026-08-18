<script setup lang="ts">
import { menuData } from "../utils/menuData";

// Extract just the sections to show on the dashboard
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
          </AppCard>
        </div>
      </section>
    </div>

    <AppDashboardAside />
  </div>
</template>

<style scoped lang="scss">
.p-dashboard {
  display: flex;
  flex-direction: row; /* Desktop default */
  align-items: flex-start;
  gap: var(--gap-section);
  padding-bottom: var(--gap-section);

  @include mq("md") {
    flex-direction: column;
    align-items: stretch;
  }

  &__main {
    flex: 1;
    display: flex;
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
  &__header {
    display: flex;
    align-items: flex-start;
    gap: var(--gap-element);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-bold);
    color: var(--card-accent, var(--color-text-main));
    margin-bottom: var(--gap-element);
    word-break: keep-all;
    overflow-wrap: anywhere;
    line-break: strict;
  }

  &__desc {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
}
</style>
