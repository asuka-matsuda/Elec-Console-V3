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
</script>

<template>
  <Panel
    :as="componentTag"
    :to="isClickable ? item.href : undefined"
    :interactive="isClickable"
    :disabled="Boolean(item.disabled)"
    class="flex flex-col gap-panel-gap h-full"
  >
    <header v-if="item.icon || item.text" class="flex items-center gap-item-gap min-w-0 tile-title">
      <Icon v-if="item.icon" :name="item.icon" class="shrink-0" />
      <span v-if="item.text">{{ item.text }}</span>
    </header>

    <p v-if="item.desc" class="m-0 tile-desc">
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
  line-height: var(--line-height-normal);
  color: var(--color-text-secondary);
  letter-spacing: var(--tracking-normal);
}
</style>
