<script setup lang="ts">
/**
 * AppIcon
 * @lucide/vue をベースにしたモダンなアイコンコンポーネントです。
 * v-html を使用せず、Vue のコンポーネントとして最適化された SVG を描画します。
 */
import { computed } from 'vue'

import type { IconName } from '~/constants/icons'
import { ICONS } from '~/constants/icons'

interface Props {
  name: IconName | string
  size?: 'sm' | 'md' | 'lg'
}

const { name, size } = defineProps<Props>()

const iconComponent = computed(() => {
  return ICONS[name] || null
})
</script>

<template>
  <i
    class="app-icon icon"
    :class="size && `is-${size}`"
  >
    <component
      :is="iconComponent"
      v-if="iconComponent"
      class="icon-svg"
      :stroke-width="2"
      aria-hidden="true"
    />
  </i>
</template>

<style scoped lang="scss">
.app-icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;

  .icon-svg,
  :deep(svg) {
    width: 100%;
    height: 100%;
  }

  &.is-sm {
    width: var(--icon-size-sm);
    height: var(--icon-size-sm);
  }

  &.is-md {
    width: var(--icon-size-md);
    height: var(--icon-size-md);
  }

  &.is-lg {
    width: var(--icon-size-lg);
    height: var(--icon-size-lg);
  }
}
</style>
