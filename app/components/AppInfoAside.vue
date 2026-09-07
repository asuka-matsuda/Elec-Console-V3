<script setup lang="ts">
import { computed } from 'vue'

import type { AnnouncementItem, HistoryItem } from '~/types/components'

/**
 * AppInfoAside
 * お知らせや更新履歴などのインフォメーションを表示するサイドバーコンポーネント
 */
const props = withDefaults(
  defineProps<{
    announcements?: AnnouncementItem[]
    history?: HistoryItem[]
    pending?: boolean
    maxCount?: number
  }>(),
  {
    announcements: () => [],
    history: () => [],
    pending: false,
    maxCount: 4,
  },
)

const recentAnnouncements = computed(() =>
  props.announcements.slice(0, props.maxCount),
)

const recentHistory = computed(() =>
  props.history.slice(0, props.maxCount),
)
</script>

<template>
  <aside class="c-info-aside">
    <!-- Announcements -->
    <section class="c-info-aside__section">
      <AppSectionHeader title="お知らせ" icon="bell" size="md" />

      <div v-if="pending" class="c-info-aside__list">
        <AppPanel class="c-info-card">
          <p class="c-info-card__desc">お知らせを読み込み中...</p>
        </AppPanel>
      </div>

      <div v-else-if="recentAnnouncements.length > 0" class="c-info-aside__list">
        <AppPanel
          v-for="item in recentAnnouncements"
          :key="item.title"
          class="c-info-card"
        >
          <div class="c-info-card__title">{{ item.title }}</div>
          <p class="c-info-card__desc">{{ item.date }} {{ item.desc }}</p>
        </AppPanel>
      </div>

      <div v-else class="c-info-aside__list">
        <AppPanel class="c-info-card">
          <p class="c-info-card__desc">現在新しいお知らせはありません。</p>
        </AppPanel>
      </div>
    </section>

    <!-- History -->
    <section class="c-info-aside__section">
      <AppSectionHeader title="更新履歴" icon="clock" size="md" />

      <div v-if="pending" class="c-info-aside__list">
        <AppPanel class="c-info-card">
          <p class="c-info-card__desc">更新履歴を読み込み中...</p>
        </AppPanel>
      </div>

      <div v-else-if="recentHistory.length > 0" class="c-info-aside__list">
        <AppPanel
          v-for="item in recentHistory"
          :key="item.version"
          class="c-info-card"
        >
          <div class="c-info-card__title">
            <AppBadge
              :color="item.status === 'success' ? 'var(--color-status-success)' : 'var(--color-text-muted)'"
            >
              {{ item.version }}
            </AppBadge>
            <span class="c-info-aside__item-title">{{ item.title }}</span>
          </div>
          <p class="c-info-card__desc">{{ item.date }} {{ item.desc }}</p>
        </AppPanel>
      </div>

      <div v-else class="c-info-aside__list">
        <AppPanel class="c-info-card">
          <p class="c-info-card__desc">現在更新履歴はありません。</p>
        </AppPanel>
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

  .c-info-card {
    &__title {
      display: flex;
      gap: var(--space-1);
      align-items: center;

      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-bold);
      line-height: var(--line-height-tight);
      color: var(--color-text-main);
    }

    &__desc {
      font-size: var(--font-size-xs);
      line-height: var(--line-height-base);
      color: var(--color-text-secondary);
    }
  }
}
</style>
