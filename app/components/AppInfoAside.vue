<script setup lang="ts">
import { computed } from 'vue'

import type { AnnouncementItem, HistoryItem } from '~/types/components'

/**
 * AppInfoAside
 * お知らせや更新履歴などのインフォメーションを表示するコンポーネント
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

interface InfoItemDisplay {
  key: string
  title: string
  date: string
  desc?: string
  badge?: {
    text: string
    color: string
  }
}

interface SectionConfig {
  title: string
  icon: string
  loadingText: string
  emptyText: string
  items: InfoItemDisplay[]
}

const sections = computed<SectionConfig[]>(() => [
  {
    title: 'お知らせ',
    icon: 'bell',
    loadingText: 'お知らせを読み込み中...',
    emptyText: '現在新しいお知らせはありません',
    items: announcements.slice(0, maxCount).map(item => ({
      key: item.title,
      title: item.title,
      date: item.date,
      desc: item.desc,
    })),
  },
  {
    title: '更新履歴',
    icon: 'clock',
    loadingText: '更新履歴を読み込み中...',
    emptyText: '現在更新履歴はありません',
    items: history.slice(0, maxCount).map(item => ({
      key: item.version,
      title: item.title,
      date: item.date,
      desc: item.desc,
      badge: {
        text: item.version,
        color:
          item.status === 'success'
            ? 'var(--color-status-success)'
            : 'var(--color-text-muted)',
      },
    })),
  },
])
</script>

<template>
  <div class="info-aside">
    <section
      v-for="section in sections"
      :key="section.title"
      class="section"
    >
      <AppSectionHeader :title="section.title" :icon="section.icon" size="md" />

      <div v-if="pending" class="list">
        <AppPanel class="status-panel">
          <AppIcon name="loader" class="u-spin" size="sm" />
          <span>{{ section.loadingText }}</span>
        </AppPanel>
      </div>

      <div v-else-if="section.items.length > 0" class="list">
        <AppPanel
          v-for="item in section.items"
          :key="item.key"
          class="info-item"
        >
          <div class="item-header">
            <AppBadge v-if="item.badge" :color="item.badge.color">
              {{ item.badge.text }}
            </AppBadge>
            <span class="item-title">{{ item.title }}</span>
          </div>
          <div class="item-meta">{{ item.date }}</div>
          <p v-if="item.desc" class="item-desc">{{ item.desc }}</p>
        </AppPanel>
      </div>

      <div v-else class="list">
        <AppPanel class="status-panel">
          <AppIcon name="inbox" size="sm" />
          <span>{{ section.emptyText }}</span>
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
  gap: var(--space-panel-gap);
}

.list {
  display: flex;
  flex-direction: column;
  gap: var(--space-panel-gap);
}

.info-item {
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

.item-header {
  display: flex;
  gap: var(--space-1-5);
  align-items: center;
}

.item-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--color-text-main);
}

.item-meta {
  font-size: var(--font-size-2xs);
  line-height: var(--line-height-tight);
  color: var(--color-text-muted);
  letter-spacing: var(--tracking-wide);
}

.item-desc {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-base);
  color: var(--color-text-secondary);
}

.status-panel {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  justify-content: center;

  padding: var(--space-4);

  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
