<script setup lang="ts" generic="T extends InfoListItem = InfoListItem">
/**
 * InfoList
 * [Dashboard Molecules] お知らせや更新履歴等のタイムライン情報を一覧表示するダッシュボード専用フィード。
 * タイトルと日付のみをコンパクトに表示し、クリックで詳細展開（モーダル等）への導線を提供します。
 */
import type { InfoListItem, InfoListProps } from '~/types/components'

withDefaults(defineProps<InfoListProps<T>>(), {
  items: () => [],
  pending: false,
  loadingText: '読み込み中...',
  emptyText: '現在情報はありません',
})

defineEmits<{
  select: [item: T]
}>()
</script>

<template>
  <Panel padding="none">

    <EmptyState
      v-if="pending || items.length === 0"
      :icon="pending ? 'loader' : 'inbox'"
      :spin="pending"
      :title="pending ? loadingText : emptyText"
    />

    <ul v-else class="m-0 p-0 flex flex-col list-none">
      <li
        v-for="(item, index) in items"
        :key="item.id ?? `${item.date}-${index}`"
        class="feed-item flex flex-col gap-inline-gap p-panel-pad"
        @click="$emit('select', item)"
      >
        <div class="flex items-center justify-between gap-item-gap">
          <time>{{ item.date }}</time>
          <slot name="badge" :item="item" />
        </div>

        <span>{{ item.title }}</span>
      </li>
    </ul>
  </Panel>
</template>

<style scoped lang="scss">
.feed-item {
  cursor: pointer;
  user-select: none;
  transition: var(--transition-interactive);

  &:not(:first-child) {
    border-top: var(--border-width-base) solid var(--color-border-subtle);
  }

  time {
    font-family: var(--font-mono);
    font-size: var(--font-size-2xs);
    color: var(--color-text-muted);
    transition: color var(--transition-interactive);
  }

  > span {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    line-height: var(--line-height-tight);
    color: var(--color-text-main);

    transition: color var(--transition-interactive);
  }

  &:hover {
    background: linear-gradient(135deg, color-mix(in srgb, var(--theme-accent) 8%, transparent), transparent 80%);
    box-shadow: var(--surface-rim-accent);

    time {
      color: var(--color-text-secondary);
    }

    > span {
      color: color-mix(in srgb, var(--theme-accent) 30%, var(--color-text-main));
    }
  }
}
</style>
