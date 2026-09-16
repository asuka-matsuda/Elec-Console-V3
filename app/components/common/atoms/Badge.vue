<script setup lang="ts">
/**
 * Badge
 * [Atoms] 状態、カテゴリ、タグなどを視覚的に示すためのバッジコンポーネント。
 * プリセットID（badgeConfig）による定義参照、または動的なカラー指定を受け付けます。
 * 親要素のフォントサイズ（em）に自動追従し、color から文字・ボーダー・背景色を自動導出します。
 */
import { computed, useSlots } from 'vue'

import { BADGE_PRESETS } from '~/constants/badgeConfig'
import type { BadgeProps } from '~/types/components'

const props = defineProps<BadgeProps>()

const slots = useSlots()

const preset = computed(() => {
  if (props.id) {
    return BADGE_PRESETS[props.id]
  }

  return undefined
})

// 優先順位: 直接指定の color > プリセットの色 > デフォルト
const resolvedColor = computed(() => props.color || preset.value?.color || 'var(--color-text-muted)')

// スロットが渡されていない場合、プリセットに label が定義されていればデフォルトテキストとして採用
const defaultLabel = computed(() => {
  if (slots.default) return ''

  if (preset.value && 'label' in preset.value) {
    return preset.value.label
  }

  return ''
})
</script>

<template>
  <span
    class="inline-block badge"
    :style="{ '--glow-color': resolvedColor }"
  >
    <slot>{{ defaultLabel }}</slot>
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

  background-color: color-mix(in srgb, var(--glow-color) 14%, transparent);

  transition: var(--transition-base);
}
</style>
