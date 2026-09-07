<script setup lang="ts">
import { computed } from 'vue'

import type { AnnouncementItem, HistoryItem } from '~/types/components'

/**
 * AppInfoAside
 * お知らせや更新履歴などのインフォメーションを表示するサイドバーコンポーネント
 */
interface Props {
  announcements?: AnnouncementItem[]
  history?: HistoryItem[]
  pending?: boolean
  maxCount?: number
}

const {
  announcements = [],
  history = [],
  pending = false,
  maxCount = 4,
} = defineProps<Props>()

const recentAnnouncements = computed(() => announcements.slice(0, maxCount))
const recentHistory = computed(() => history.slice(0, maxCount))
</script>

<template>
  <div class="info-aside">
    <!-- Announcements -->
    <section class="section">
      <AppSectionHeader title="お知らせ" icon="bell" size="md" />

      <div v-if="pending" class="list">
        <AppPanel class="status-card">
          <AppIcon name="loader" class="u-spin" size="sm" />
          <span>お知らせを読み込み中...</span>
        </AppPanel>
      </div>

      <div v-else-if="recentAnnouncements.length > 0" class="list">
        <AppPanel
          v-for="item in recentAnnouncements"
          :key="item.title"
          class="info-card"
        >
          <div class="card-header">
            <span class="card-title">{{ item.title }}</span>
          </div>
          <div class="card-meta">{{ item.date }}</div>
          <p v-if="item.desc" class="card-desc">{{ item.desc }}</p>
        </AppPanel>
      </div>

      <div v-else class="list">
        <AppPanel class="status-card">
          <AppIcon name="inbox" size="sm" />
          <span>現在新しいお知らせはありません</span>
        </AppPanel>
      </div>
    </section>

    <!-- History -->
    <section class="section">
      <AppSectionHeader title="更新履歴" icon="clock" size="md" />

      <div v-if="pending" class="list">
        <AppPanel class="status-card">
          <AppIcon name="loader" class="u-spin" size="sm" />
          <span>更新履歴を読み込み中...</span>
        </AppPanel>
      </div>

      <div v-else-if="recentHistory.length > 0" class="list">
        <AppPanel
          v-for="item in recentHistory"
          :key="item.version"
          class="info-card"
        >
          <div class="card-header">
            <AppBadge
              :color="item.status === 'success' ? 'var(--color-status-success)' : 'var(--color-text-muted)'"
            >
              {{ item.version }}
            </AppBadge>
            <span class="card-title">{{ item.title }}</span>
          </div>
          <div class="card-meta">{{ item.date }}</div>
          <p v-if="item.desc" class="card-desc">{{ item.desc }}</p>
        </AppPanel>
      </div>

      <div v-else class="list">
        <AppPanel class="status-card">
          <AppIcon name="inbox" size="sm" />
          <span>現在更新履歴はありません</span>
        </AppPanel>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.info-aside {
  display: flex;
  flex-direction: column;
  gap: var(--space-section-gap);
  width: 100%;
}

.section {
  display: flex;
  flex-direction: column;
  gap: var(--space-card-gap);
}

.list {
  display: flex;
  flex-direction: column;
  gap: var(--space-card-gap);
}

.info-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  transition:
    border-color var(--transition-fast),
    background-color var(--transition-fast);

  &:hover {
    border-color: color-mix(in srgb, var(--theme-accent) 40%, var(--color-border));
  }
}

.card-header {
  display: flex;
  gap: var(--space-1-5);
  align-items: center;
}

.card-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--color-text-main);
}

.card-meta {
  font-size: var(--font-size-2xs);
  line-height: var(--line-height-tight);
  color: var(--color-text-muted);
  letter-spacing: var(--tracking-wide);
}

.card-desc {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-base);
  color: var(--color-text-secondary);
}

.status-card {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  justify-content: center;

  padding: var(--space-4);

  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
