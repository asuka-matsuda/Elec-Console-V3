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
    <section v-for="section in sections" :key="section.title">
      <MoleculesSectionHeader :title="section.title" :icon="section.icon" size="md" />

      <AtomsPanel v-if="pending" class="status">
        <AtomsIcon name="loader" class="u-spin" size="sm" />
        <span>{{ section.loadingText }}</span>
      </AtomsPanel>

      <template v-else-if="section.items.length > 0">
        <AtomsPanel
          v-for="item in section.items"
          :key="item.key"
          class="item"
        >
          <header>
            <AtomsBadge v-if="item.badge" :color="item.badge.color">
              {{ item.badge.text }}
            </AtomsBadge>
            <strong>{{ item.title }}</strong>
          </header>
          <time>{{ item.date }}</time>
          <p v-if="item.desc">{{ item.desc }}</p>
        </AtomsPanel>
      </template>

      <AtomsPanel v-else class="status">
        <AtomsIcon name="inbox" size="sm" />
        <span>{{ section.emptyText }}</span>
      </AtomsPanel>
    </section>
  </div>
</template>

<style scoped lang="scss">
.info-aside {
  display: flex;
  flex-direction: column;
  gap: var(--space-section-gap);

  section {
    display: flex;
    flex-direction: column;
    gap: var(--space-panel-gap);
  }

  .item {
    gap: var(--space-1);

    header {
      display: flex;
      gap: var(--space-1-5);
      align-items: center;
      font-size: var(--font-size-sm);
    }

    time {
      font-size: var(--font-size-2xs);
      color: var(--color-text-muted);
    }

    p {
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
    }
  }

  .status {
    flex-direction: row;
    gap: var(--space-2);
    align-items: center;
    justify-content: center;

    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
}
</style>
