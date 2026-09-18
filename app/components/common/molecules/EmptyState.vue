<script setup lang="ts">
/**
 * EmptyState
 * [Molecules] データが0件の場合や未選択状態を分かりやすく伝えるコンポーネント。
 */
import type { EmptyStateProps } from '~/types/components'

defineProps<EmptyStateProps>()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-1.5 py-4 px-4 text-center">
    <p v-if="title || icon" class="flex items-center justify-center gap-1.5 title">
      <Icon v-if="icon" :name="icon" :spin="spin" />
      <span v-if="title">{{ title }}</span>
    </p>

    <p v-if="description" class="desc">
      {{ description }}
    </p>

    <div v-if="$slots.actions" class="flex items-center justify-center gap-2 mt-1">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--color-text-secondary);
}

.desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
