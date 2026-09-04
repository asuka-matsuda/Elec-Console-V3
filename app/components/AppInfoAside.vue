<script setup lang="ts">
import { computed } from 'vue'

import { useFetch } from '#app'

/**
 * AppInfoAside
 * お知らせや更新履歴などのインフォメーションを表示するサイドバーコンポーネント
 */
export interface AnnouncementItem {
  id?: number | string
  title: string
  date: string
  desc: string
}

export interface HistoryItem {
  id?: number | string
  version: string
  title: string
  date: string
  desc: string
  status?: string
}

export interface DashboardData {
  announcements: AnnouncementItem[]
  history: HistoryItem[]
}

const { data: dashboardData, pending } = await useFetch<DashboardData>('/api/dashboard', {
  lazy: true,
  default: () => ({ announcements: [], history: [] }),
})

const MAX_DISPLAY_COUNT = 4

const recentAnnouncements = computed(() =>
  dashboardData.value.announcements.slice(0, MAX_DISPLAY_COUNT),
)

const recentHistory = computed(() =>
  dashboardData.value.history.slice(0, MAX_DISPLAY_COUNT),
)
</script>

<template>
  <aside class="c-info-aside">
    <!-- Announcements -->
    <section class="c-info-aside__section">
      <AppSectionHeader title="お知らせ" icon="bell" size="md" />

      <div v-if="pending" class="c-info-aside__list">
        <AppCard description="お知らせを読み込み中..." />
      </div>

      <div v-else-if="recentAnnouncements.length > 0" class="c-info-aside__list">
        <AppCard
          v-for="item in recentAnnouncements"
          :key="item.title"
          :title="item.title"
          :description="`${item.date} ${item.desc}`"
        />
      </div>

      <div v-else class="c-info-aside__list">
        <AppCard description="現在新しいお知らせはありません。" />
      </div>
    </section>

    <!-- History -->
    <section class="c-info-aside__section">
      <AppSectionHeader title="更新履歴" icon="clock" size="md" />

      <div v-if="pending" class="c-info-aside__list">
        <AppCard description="更新履歴を読み込み中..." />
      </div>

      <div v-else-if="recentHistory.length > 0" class="c-info-aside__list">
        <AppCard
          v-for="item in recentHistory"
          :key="item.version"
          :description="`${item.date} ${item.desc}`"
        >
          <template #title>
            <AppBadge
              :color="item.status === 'success' ? 'success' : 'secondary'"
            >
              {{ item.version }}
            </AppBadge>
            <span class="c-info-aside__item-title">{{ item.title }}</span>
          </template>
        </AppCard>
      </div>

      <div v-else class="c-info-aside__list">
        <AppCard description="現在更新履歴はありません。" />
      </div>
    </section>
  </aside>
</template>

<style scoped lang="scss">
.c-info-aside {
  @include flex-start-stretch($direction: column);

  position: sticky;
  top: var(--space-layout-pad);

  overflow-y: auto;
  flex-shrink: 0;
  gap: var(--space-section-gap);

  width: var(--sidebar-width);
  max-height: calc(100dvh - var(--space-layout-pad) * 2);

  @include mq("md") {
    position: static;
    overflow-y: visible;
    width: 100%;
    max-height: none;
  }

  &__section {
    @include flex-start-stretch($direction: column);

    gap: var(--space-card-gap);
  }

  &__list {
    @include flex-start-stretch($direction: column);

    gap: var(--space-card-gap);
  }

  &__item-title {
    color: var(--color-text-main);
  }
}
</style>
