<script setup lang="ts">
/**
 * MoleculesEmptyState
 * [Molecules] データが0件の場合や未選択状態を分かりやすくユーザーに伝えるためのメッセージコンポーネント。
 */
import type { IconName } from '~/constants/icons'

interface Props {
  icon?: IconName
  title?: string
  description?: string
}

defineProps<Props>()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-1.5 max-w-[420px] mx-auto py-8 px-4 text-center empty-state">
    <Icon v-if="icon" :name="icon" size="xxl" :spin="icon === 'loader'" class="mb-1.5" />

    <h3 v-if="title || $slots.default" class="title">
      <slot>{{ title }}</slot>
    </h3>

    <p v-if="description" class="desc">
      {{ description }}
    </p>

    <div v-if="$slots.actions" class="flex items-center justify-center gap-2 mt-2">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.empty-state {
  color: var(--color-text-muted);
  opacity: 0.8;

  .title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-secondary);
  }

  .desc {
    font-size: var(--font-size-2xs);
    line-height: var(--line-height-base);
    color: var(--color-text-muted);
  }
}
</style>
