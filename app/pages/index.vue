<script setup lang="ts">
import { menuData } from "../utils/menuData";

// Extract just the sections to show on the dashboard
const dashboardSections = menuData.filter((section) => section.showInDashboard);

const { data: dashboardData } = await useFetch("/api/dashboard");
const announcements = computed(() => dashboardData.value?.announcements || []);
const history = computed(() => dashboardData.value?.history || []);
</script>

<template>
  <div class="p-dashboard">
    <!-- Left Column: Menu Cards -->
    <div class="p-dashboard__main">
      <section
        v-for="section in dashboardSections"
        :key="section.id"
        class="p-dashboard__section"
      >
        <AppSectionHeader
          :title="section.heading"
          :icon="section.icon"
          :variant="section.accent || 'main'"
        />

        <div class="p-dashboard__grid">
          <AppCard
            v-for="(item, index) in section.items"
            :key="index"
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

    <!-- Right Column: Announcements & History -->
    <aside class="p-dashboard__aside">
      <!-- Announcements -->
      <section class="p-dashboard__aside-block">
        <AppSectionHeader
          title="お知らせ"
          icon="bell"
          variant="tool"
          size="md"
        />
        <div class="p-dashboard__list">
          <AppCard
            v-for="(item, idx) in announcements"
            :key="idx"
            class="p-dashboard-list-item"
          >
            <div class="p-dashboard-list-item__title">{{ item.title }}</div>
            <div class="p-dashboard-list-item__meta">
              {{ item.date }} {{ item.desc }}
            </div>
          </AppCard>
        </div>
      </section>

      <!-- History -->
      <section class="p-dashboard__aside-block">
        <AppSectionHeader
          title="更新履歴"
          icon="clock"
          variant="management"
          size="md"
        />
        <div class="p-dashboard__list">
          <AppCard
            v-for="(item, idx) in history"
            :key="idx"
            class="p-dashboard-list-item"
          >
            <div class="p-dashboard-list-item__header">
              <AppBadge
                v-if="item.badgeClass === 'c-badge--success'"
                variant="success"
                >{{ item.version }}</AppBadge
              >
              <AppBadge v-else variant="neutral">{{ item.version }}</AppBadge>
              <span class="p-dashboard-list-item__title">{{ item.title }}</span>
            </div>
            <div class="p-dashboard-list-item__meta">
              {{ item.date }} {{ item.desc }}
            </div>
          </AppCard>
        </div>
      </section>
    </aside>
  </div>
</template>

<style scoped lang="scss">
.p-dashboard {
  display: flex;
  flex-direction: row; // Desktop default
  align-items: flex-start;
  gap: var(--space-8);
  padding-bottom: var(--space-8);

  @include mq("lg") {
    flex-direction: column;
    align-items: stretch;
  }

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
  }

  &__aside {
    width: 320px; // Desktop default
    flex-shrink: 0;
    position: sticky;
    top: var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-8);

    @include mq("lg") {
      width: 100%;
      position: static;
    }
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--space-4);
  }

  &__aside-block {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
}

// Inner Card Styles
.p-dashboard-card {
  &__header {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    font-size: var(--text-base);
    font-weight: var(--font-weight-bold);
    color: var(--card-accent, var(--color-text-main));
    margin-bottom: var(--space-2);
    word-break: keep-all;
    overflow-wrap: anywhere;
    line-break: strict;
  }

  &__desc {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }
}

// List Item Card Styles
.p-dashboard-list-item {
  padding: var(--space-3) var(--space-4);

  &__header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-1);
  }

  &__title {
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
  }

  &__meta {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    margin-top: var(--space-1);
  }
}
</style>
