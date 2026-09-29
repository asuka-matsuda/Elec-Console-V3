<script setup lang="ts">
/**
 * Divider
 * [Atoms] 画面やコンテンツの区切り線を表示する最小コンポーネント。
 * カテゴリカラー（--theme-accent）による水平フェード（fade-side / fade-center）および構造的ソリッド（solid / 垂直方向）に対応します。
 */
import { computed } from 'vue'

import type { DividerProps } from '~/types/components'

const props = withDefaults(defineProps<DividerProps>(), {
  type: 'fade-side',
  orientation: 'horizontal',
})

// 垂直方向は構造的にフェードが存在しないため、常に solid として解決する
const effectiveType = computed(() =>
  props.orientation === 'vertical' ? 'solid' : props.type,
)
</script>

<template>
  <hr
    class="divider shrink-0"
    :class="[
      orientation === 'horizontal'
        ? 'w-full h-px'
        : 'w-px h-full min-h-[1em] self-stretch',
      `is-${effectiveType}`,
      `is-${orientation}`,
    ]"
    :style="color ? { '--divider-custom-color': color } : undefined"
  >
</template>

<style scoped lang="scss">
.divider {
  --divider-accent: var(--divider-custom-color, var(--theme-accent));

  border: none;

  // 1. 起点アクセントから右へ抜けるグラデーション
  &.is-fade-side {
    background: linear-gradient(
      to right,
      var(--divider-accent) 0%,
      color-mix(in srgb, var(--divider-accent) 35%, transparent) 40%,
      transparent 100%
    );
  }

  // 2. 中央が光り両端がフェードするグラデーション
  &.is-fade-center {
    background: linear-gradient(
      to right,
      transparent 0%,
      var(--divider-accent) 50%,
      transparent 100%
    );
  }

  // 3. 均一な境界線（背景・枠線に馴染む控えめなボーダー）
  &.is-solid {
    background-color: var(--divider-custom-color, var(--color-border));
  }
}
</style>
