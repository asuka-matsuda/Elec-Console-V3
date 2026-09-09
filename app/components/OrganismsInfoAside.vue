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
      key: item.id ? String(item.id) : `${item.date}-${item.title}`,
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
      key: item.id ? String(item.id) : `${item.version}-${item.date}`,
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

      <AtomsPanel class="!p-0 overflow-hidden panel-container">
        <!-- 読み込み中状態 -->
        <div
          v-if="pending"
          class="flex items-center justify-center gap-[var(--space-2)] p-[var(--space-panel-pad)] text-[var(--font-size-xs)] status-message"
        >
          <AtomsIcon name="loader" class="u-spin" size="sm" />
          <span>{{ section.loadingText }}</span>
        </div>

        <!-- 一覧表示 -->
        <ul v-else-if="section.items.length > 0" class="flex flex-col divide-y divide-[var(--color-border-subtle)] m-0 p-0 list-none">
          <li
            v-for="item in section.items"
            :key="item.key"
            class="group relative flex flex-col gap-[var(--space-1)] p-[var(--space-panel-pad)] item-row"
          >
            <div class="flex items-center justify-between gap-[var(--space-2)]">
              <time class="font-mono text-[var(--font-size-2xs)] tabular-nums item-date">
                {{ item.date }}
              </time>
              <AtomsBadge v-if="item.badge" :color="item.badge.color" class="shrink-0">
                {{ item.badge.text }}
              </AtomsBadge>
            </div>
            <strong class="font-medium text-[var(--font-size-sm)] leading-snug tracking-tight item-title">
              {{ item.title }}
            </strong>
            <p v-if="item.desc" class="m-0 text-[var(--font-size-xs)] leading-relaxed item-desc">
              {{ item.desc }}
            </p>
          </li>
        </ul>

        <!-- 空状態 -->
        <div
          v-else
          class="flex items-center justify-center gap-[var(--space-2)] p-[var(--space-panel-pad)] text-[var(--font-size-xs)] status-message"
        >
          <AtomsIcon name="inbox" size="sm" />
          <span>{{ section.emptyText }}</span>
        </div>
      </AtomsPanel>
    </section>
  </div>
</template>

<style scoped lang="scss">
.item-row {
  transition: var(--transition-base);

  &::before {
    content: "";

    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;

    width: 2px;

    background-color: transparent;

    transition: var(--transition-base);
  }

  &:hover {
    background-color: color-mix(in srgb, var(--color-surface-hover) 80%, transparent);

    &::before {
      background-color: var(--theme-accent, var(--color-primary));
      box-shadow: 0 0 8px var(--theme-accent, var(--color-primary));
    }

    .item-title {
      color: var(--color-text-primary);
    }
  }
}

.item-date {
  color: var(--color-text-muted);
}

.item-title {
  color: var(--color-text-base);
  transition: var(--transition-base);
}

.item-desc {
  color: var(--color-text-secondary);
}

.status-message {
  color: var(--color-text-muted);
}
</style>
