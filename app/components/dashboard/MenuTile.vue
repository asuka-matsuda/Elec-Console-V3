<script setup lang="ts">
/**
 * MenuTile
 * [Dashboard Molecules] ダッシュボードで各機能を選択するための専用ナビゲーションタイル。
 * MenuItem を直接受け取り、Panel アトムのサーフェス装飾・状態管理へ完全委任します。
 */
import { computed } from 'vue'

import { NuxtLink } from '#components'
import type { MenuTileProps } from '~/types/components'

const { item } = defineProps<MenuTileProps>()

const isClickable = computed(() => !item.disabled && Boolean(item.href))
const componentTag = computed(() => (isClickable.value ? NuxtLink : 'div'))

const resolvedBadge = computed(() => {
  if (item.badge) {
    if (typeof item.badge === 'string') {
      return { text: item.badge, color: undefined }
    }

    return {
      text: item.badge.text,
      color: item.badge.color,
    }
  }
  if (item.version) {
    return { text: item.version, color: undefined }
  }

  return null
})
</script>

<template>
  <Panel
    :as="componentTag"
    :to="isClickable ? item.href : undefined"
    :interactive="isClickable"
    :disabled="Boolean(item.disabled)"
    class="flex flex-col gap-panel-gap h-full"
  >
    <header v-if="item.icon || item.text || $slots.badge || resolvedBadge" class="flex items-center gap-item-gap min-w-0">
      <Icon v-if="item.icon" :name="item.icon" />
      <span v-if="item.text" class="flex-1 min-w-0 tile-title">{{ item.text }}</span>

      <slot v-if="$slots.badge || resolvedBadge" name="badge" :item="item">
        <Badge
          v-if="resolvedBadge"
          :color="resolvedBadge.color"
          class="shrink-0 ml-auto"
        >
          {{ resolvedBadge.text }}
        </Badge>
      </slot>
    </header>

    <p v-if="item.desc" class="tile-desc">
      {{ item.desc }}
    </p>
  </Panel>
</template>

<style scoped lang="scss">
.tile-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--theme-accent);
  letter-spacing: var(--tracking-wide);
  word-break: keep-all;
  line-break: strict;
  overflow-wrap: anywhere;
}

.tile-desc {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-base);
  color: var(--color-text-secondary);
  letter-spacing: var(--tracking-normal);
}
</style>
