<script setup lang="ts">
import AppPanel from '../components/layout/AppPanel.vue'
import AppCard from '../components/layout/AppCard.vue'
import AppIcon from '../components/elements/AppIcon.vue'
import AppDivider from '../components/layout/AppDivider.vue'
import AppBadge from '../components/elements/AppBadge.vue'
import { menuData } from '../utils/menuData'

// Extract just the sections to show on the dashboard
const dashboardSections = menuData.filter(section => section.showInDashboard)

// Mock Data for Announcements
const announcements = [
  { title: 'システムメンテナンスのお知らせ', date: '2026.08.01', desc: '深夜2時から4時まで停止します。' },
  { title: '新しいツール「ケーブル重量概算」をリリース', date: '2026.07.15', desc: '木製ドラムの選定がより簡単になりました。' }
]

// Mock Data for History
const history = [
  { version: 'v2.1.0', title: 'ダッシュボードのUIリニューアル', date: '2026.08.06', desc: 'サイバーテーマへ移行しました。', badgeClass: 'c-badge--success' },
  { version: 'v2.0.5', title: '軽微なバグ修正', date: '2026.07.20', desc: '配管計算の数値を一部修正。', badgeClass: 'c-badge--secondary' }
]
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
        <header class="p-dashboard__section-header">
          <h2 class="p-dashboard__section-title" :style="`--section-color: var(--color-category-${section.accent})`">
            <AppIcon v-if="section.icon" :name="section.icon" />
            {{ section.heading }}
          </h2>
          <AppDivider :variant="section.accent || 'default'" />
        </header>

        <div class="p-dashboard__grid">
          <AppCard 
            v-for="(item, index) in section.items" 
            :key="index"
            :variant="section.accent"
            :to="item.disabled ? undefined : item.href"
            :disabled="item.disabled"
          >
            <div class="p-dashboard-card__header" :style="`--card-accent: var(--color-category-${section.accent})`">
              <AppIcon :name="item.icon" class="p-dashboard-card__icon" />
              <span>{{ item.text }}</span>
            </div>
            <div class="p-dashboard-card__desc">
              {{ item.desc || '※準備中…' }}
            </div>
          </AppCard>
        </div>
      </section>
    </div>

    <!-- Right Column: Announcements & History -->
    <aside class="p-dashboard__aside">
      <!-- Announcements -->
      <section class="p-dashboard__aside-block">
        <header class="p-dashboard__aside-header">
          <h2 class="p-dashboard__aside-title" style="--section-color: var(--color-category-tool)">
            <AppIcon name="bell" /> お知らせ
          </h2>
          <AppDivider variant="tool" />
        </header>
        <div class="p-dashboard__list">
          <AppCard v-for="(item, idx) in announcements" :key="idx" class="p-dashboard-list-item">
            <div class="p-dashboard-list-item__title">{{ item.title }}</div>
            <div class="p-dashboard-list-item__meta">{{ item.date }} {{ item.desc }}</div>
          </AppCard>
        </div>
      </section>

      <!-- History -->
      <section class="p-dashboard__aside-block">
        <header class="p-dashboard__aside-header">
          <h2 class="p-dashboard__aside-title" style="--section-color: var(--color-category-management)">
            <AppIcon name="clock" /> 更新履歴
          </h2>
          <AppDivider variant="management" />
        </header>
        <div class="p-dashboard__list">
          <AppCard v-for="(item, idx) in history" :key="idx" class="p-dashboard-list-item">
            <div class="p-dashboard-list-item__header">
              <AppBadge variant="success" v-if="item.badgeClass === 'c-badge--success'">{{ item.version }}</AppBadge>
              <AppBadge variant="default" v-else>{{ item.version }}</AppBadge>
              <span class="p-dashboard-list-item__title">{{ item.title }}</span>
            </div>
            <div class="p-dashboard-list-item__meta">{{ item.date }} {{ item.desc }}</div>
          </AppCard>
        </div>
      </section>
    </aside>
  </div>
</template>

<style scoped lang="scss">
.p-dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  padding-bottom: var(--space-8);

  @include mq('lg') {
    flex-direction: row;
    align-items: flex-start;
  }

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
  }

  &__aside {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--space-8);

    @include mq('lg') {
      width: 320px;
      flex-shrink: 0;
      position: sticky;
      top: var(--space-6);
    }
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  &__section-header, &__aside-header {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  &__section-title, &__aside-title {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    font-size: var(--text-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);

    .c-icon {
      color: var(--section-color);
    }
  }

  &__aside-title {
    font-size: var(--text-lg);
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
    align-items: center;
    gap: var(--space-3);
    font-size: var(--text-base);
    font-weight: var(--font-weight-bold);
    color: var(--card-accent, var(--color-text-main));
    margin-bottom: var(--space-2);
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
