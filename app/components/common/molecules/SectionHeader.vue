<script setup lang="ts">
/**
 * SectionHeader
 * [Molecules] セクションのタイトル、アイコン、アクションボタン、および区切り線を表示するヘッダーコンポーネント。
 */
import { computed } from 'vue'

import type { SectionHeaderProps } from '~/types/components'

const props = withDefaults(
  defineProps<SectionHeaderProps>(),
  {
    tag: 'h2',
    variant: 'main',
  },
)

const isBorder = computed(() => props.variant === 'border' || props.variant === 'hud')
</script>

<template>
  <header class="flex flex-wrap items-center justify-between gap-y-inline-gap gap-x-item-gap section-header">
    <Heading :tag="tag" class="flex items-center gap-item-gap title">
      <Icon v-if="icon" :name="icon" class="icon" />
      <slot>{{ title }}</slot>
    </Heading>

    <div v-if="$slots.actions" class="flex items-center gap-item-gap">
      <slot name="actions" />
    </div>

    <Divider :type="isBorder ? 'solid' : 'fade-side'" />
  </header>
</template>

<style scoped lang="scss">
.icon {
  color: var(--theme-accent);
}
</style>
