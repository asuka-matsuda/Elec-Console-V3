<script setup lang="ts">
/**
 * Skeleton
 * 読み込み待ちの波打ち（パルス）プレースホルダーコンポーネント。
 * - 呼び出し側の文脈（インライン／ブロック）に応じてタグを span / div で切り替え可能（デフォルト: span）
 * - レイアウトシフト（CLS）の防止とローディング体感速度の向上を実現
 */
import { computed } from 'vue'

import type { SkeletonProps } from '~/types/components'

const {
  width,
  height,
  circle = false,
  as = 'span',
} = defineProps<SkeletonProps>()

const styleObject = computed(() => {
  const styles: Record<string, string> = {}

  if (width) {
    styles.width = width
  }
  if (height) {
    styles.height = height
  }
  else if (!circle) {
    styles.height = '1.2em'
  }

  if (circle) {
    const size = width || height || '2.5rem'

    styles.width = size
    styles.height = size
    styles.borderRadius = 'var(--radius-circle, 50%)'
  }

  return styles
})
</script>

<template>
  <component :is="as" class="skeleton" :class="{ 'is-circle': circle }" :style="styleObject" />
</template>

<style scoped lang="scss">
.skeleton {
  display: inline-block;

  border: var(--border-width-base) solid var(--color-border);

  vertical-align: middle;

  background-color: var(--surface-bg-elevated);
  background-image: linear-gradient(
    90deg,
    transparent 0%,
    color-mix(in srgb, var(--color-overlay) 12%, transparent) 50%,
    transparent 100%
  );
  background-size: 200% 100%;

  animation: skeleton-pulse 1.8s ease-in-out infinite;
}

// ユーザー設定でアニメーション無効時のフォールバック
:root[data-animation="off"] .skeleton {
  background-image: none;
  animation: none;
}

@keyframes skeleton-pulse {
  0% {
    opacity: 0.6;
    background-position: 200% 0;
  }

  50% {
    opacity: 1;
  }

  100% {
    opacity: 0.6;
    background-position: -200% 0;
  }
}
</style>
