<script setup lang="ts">
/**
 * OrganismsInfoAside
 * [Organisms] ダッシュボード等のサイドバーに配置されるお知らせ・更新履歴の表示コンポーネント。
 * セクション見出し（MoleculesSectionHeader）とパネル（AtomsPanel）、バッジ（AtomsBadge）、アイコン（AtomsIcon）を内包します。
 */
import { computed } from 'vue'

import type { OrganismsInfoAsideProps } from '~/types/components'

const {
  announcements = [],
  history = [],
  pending = false,
  maxCount = 4,
} = defineProps<OrganismsInfoAsideProps>()

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
  <div class="flex flex-col gap-[var(--space-section-gap)] info-aside">
    <section
      v-for="section in sections"
      :key="section.title"
      class="flex flex-col gap-[var(--space-panel-gap)]"
    >
      <MoleculesSectionHeader :title="section.title" :icon="section.icon" size="md" />

      <AtomsPanel
        v-if="pending"
        class="flex flex-row items-center justify-center gap-[var(--space-2)] text-[var(--font-size-xs)] status-panel"
      >
        <AtomsIcon name="loader" class="u-spin" size="sm" />
        <span>{{ section.loadingText }}</span>
      </AtomsPanel>

      <template v-else-if="section.items.length > 0">
        <AtomsPanel
          v-for="item in section.items"
          :key="item.key"
          class="flex flex-col gap-[var(--space-1)] info-item"
        >
          <header class="flex items-center gap-[var(--space-1-5)] text-[var(--font-size-sm)]">
            <AtomsBadge v-if="item.badge" :color="item.badge.color" class="shrink-0">
              {{ item.badge.text }}
            </AtomsBadge>
            <strong class="min-w-0 font-medium tracking-tight">{{ item.title }}</strong>
          </header>
          <time class="font-mono text-[var(--font-size-2xs)] tabular-nums info-time">{{ item.date }}</time>
          <p v-if="item.desc" class="text-[var(--font-size-xs)] leading-relaxed info-desc">{{ item.desc }}</p>
        </AtomsPanel>
      </template>

      <AtomsPanel
        v-else
        class="flex flex-row items-center justify-center gap-[var(--space-2)] text-[var(--font-size-xs)] status-panel"
      >
        <AtomsIcon name="inbox" size="sm" />
        <span>{{ section.emptyText }}</span>
      </AtomsPanel>
    </section>
  </div>
</template>

<style scoped lang="scss">
.info-time {
  color: var(--color-text-muted);
}

.info-desc {
  color: var(--color-text-secondary);
}

.status-panel {
  color: var(--color-text-muted);
}
</style>
