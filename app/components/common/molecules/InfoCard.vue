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
  <AtomsPanel class="!p-0 overflow-hidden">
    <!-- ローディング・空状態 -->
    <div
      v-if="pending || displayItems.length === 0"
      class="flex items-center justify-center gap-[var(--space-2)] p-[var(--space-panel-pad)] status"
    >
      <AtomsIcon :name="pending ? 'loader' : 'inbox'" :class="{ 'u-spin': pending }" size="sm" />
      <span>{{ pending ? loadingText : emptyText }}</span>
    </div>

    <!-- 一覧表示 -->
    <ul v-else class="m-0 p-0 flex flex-col divide-y divide-[var(--color-border-subtle)] list-none">
      <li
        v-for="(item, index) in displayItems"
        :key="item.id ? String(item.id) : `${item.date}-${index}`"
        class="relative flex flex-col gap-[var(--space-1)] p-[var(--space-panel-pad)] item"
      >
        <header class="flex items-center justify-between gap-[var(--space-2)]">
          <time>{{ item.date }}</time>
          <slot name="badge" :item="item" />
        </header>

        <strong>{{ item.title }}</strong>

        <p v-if="item.desc" class="m-0">{{ item.desc }}</p>
      </li>
    </ul>
  </AtomsPanel>
</template>

<style scoped lang="scss">
.status {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.item {
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

    strong {
      color: var(--color-text-primary);
    }
  }

  time {
    font-family: var(--font-mono);
    font-size: var(--font-size-2xs);
    color: var(--color-text-muted);
  }

  strong {
    font-size: var(--font-size-sm);
    color: var(--color-text-base);
    transition: var(--transition-base);
  }

  p {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
  }
}
</style>
