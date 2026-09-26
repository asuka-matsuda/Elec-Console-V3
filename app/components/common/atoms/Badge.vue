<script setup lang="ts">
/**
 * Badge
 * [Atoms] 状態、カテゴリ、タグなどを視覚的に示すためのバッジコンポーネント。
 * プリセットID（badgeConfig）による定義参照、または動的なカラー指定を受け付けます。
 * 親要素のフォントサイズ（em）に自動追従し、color から文字・ボーダー・背景色を自動導出します。
 */
import { computed } from 'vue'

import { BADGE_PRESETS, type BadgePresetItem } from '~/constants/badgeConfig'
import type { BadgeProps } from '~/types/components'

const props = defineProps<BadgeProps>()

const preset = computed<BadgePresetItem | undefined>(() => (props.id ? BADGE_PRESETS[props.id] : undefined))

// 優先順位: 直接指定の color > プリセットの色 (未指定時は CSS 側の初期値に委譲)
const resolvedColor = computed(() => props.color || preset.value?.color)
</script>

<template>
  <span
    class="inline-block badge"
    :style="resolvedColor ? { '--glow-color': resolvedColor } : undefined"
  >
    <slot>{{ preset?.label }}</slot>
  </span>
</template>

<style scoped lang="scss">
.badge {
  --glow-color: var(--color-text-muted);

  padding: 0.15em 0.5em;
  border: var(--border-width-base) solid color-mix(in srgb, var(--glow-color) 35%, transparent);

  font-size: 0.8em;
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--glow-color);
  letter-spacing: var(--tracking-wide);
  white-space: nowrap;
  vertical-align: middle;

  background:
    linear-gradient(
      to bottom,
      color-mix(in srgb, var(--glow-color) 20%, transparent) 0%,
      color-mix(in srgb, var(--glow-color) 8%, transparent) 100%
    );
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--glow-color) 35%, transparent);

  transition: var(--transition-base);
}
</style>
