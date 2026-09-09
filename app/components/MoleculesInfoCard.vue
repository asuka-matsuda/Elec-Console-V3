<script setup lang="ts" generic="T extends InfoCardItem = InfoCardItem">
/**
 * MoleculesInfoCard
 * [Molecules] 日付、タイトル、注釈、およびスロットから注入可能なバッジを備えた情報カードコンポーネント。
 * 複数のアイテムがある場合は微細な境界線で繋がり、ホバー時にはサイバーインジケーターバーが灯ります。
 */
import { computed } from 'vue'

import type { InfoCardItem, MoleculesInfoCardProps } from '~/types/components'

const {
  items = [],
  pending = false,
  loadingText = '読み込み中...',
  emptyText = '現在情報はありません',
  maxCount = 4,
} = defineProps<MoleculesInfoCardProps<T>>()

const displayItems = computed(() => {
  return items.slice(0, maxCount)
})
</script>

<template>
  <AtomsPanel class="!p-0 overflow-hidden info-card-panel">
    <!-- 読み込み中状態 -->
    <div
      v-if="pending"
      class="flex items-center justify-center gap-[var(--space-2)] p-[var(--space-panel-pad)] text-[var(--font-size-xs)] status-message"
    >
      <AtomsIcon name="loader" class="u-spin" size="sm" />
      <span>{{ loadingText }}</span>
    </div>

    <!-- 一覧表示 -->
    <ul
      v-else-if="displayItems.length > 0"
      class="flex flex-col divide-y divide-[var(--color-border-subtle)] m-0 p-0 list-none"
    >
      <li
        v-for="(item, index) in displayItems"
        :key="item.id ? String(item.id) : `${item.date}-${index}`"
        class="group relative flex flex-col gap-[var(--space-1)] p-[var(--space-panel-pad)] item-row"
      >
        <div class="flex items-center justify-between gap-[var(--space-2)]">
          <time class="font-mono text-[var(--font-size-2xs)] tabular-nums item-date">
            {{ item.date }}
          </time>
          <slot name="badge" :item="item" />
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
      <span>{{ emptyText }}</span>
    </div>
  </AtomsPanel>
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
