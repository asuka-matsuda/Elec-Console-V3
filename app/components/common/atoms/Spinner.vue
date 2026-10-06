<script setup lang="ts">
/**
 * Spinner
 * Vercel Geist デザインシステム準拠の円形ローディングインジケーター。
 * 12本の放射状バーが時計回りにフェード回転する、Geist を象徴するミニマルな待機表示。
 *
 * 用途:
 * - ボタン内やインラインでの短時間（1〜3秒）の不定待機状態
 * - 既知のレイアウト埋めには <Skeleton>、確定進捗には <Progress> を使用してください。
 */
import { computed } from 'vue'

import type { SpinnerProps } from '~/types/components'

const props = withDefaults(defineProps<SpinnerProps>(), {
  size: 'md',
})

const resolvedSizePx = computed(() => {
  if (typeof props.size === 'number') return `${props.size}px`
  if (props.size === 'sm') return '16px'
  if (props.size === 'lg') return '32px'

  return '24px'
})

const customStyle = computed(() => {
  const styles: Record<string, string> = {
    '--spinner-size': resolvedSizePx.value,
  }

  if (props.color) {
    styles['--spinner-color'] = props.color
  }

  return styles
})

// 12本のバーの事前計算データ（30度間隔・アニメーション遅延）
const BARS = Array.from({ length: 12 }, (_, i) => ({
  rotate: i * 30,
  delay: `${((i - 12) * 0.1).toFixed(1)}s`,
}))
</script>

<template>
  <span class="geist-spinner inline-flex items-center gap-inline-gap" :style="customStyle">
    <span class="spinner-wheel inline-block shrink-0">
      <span
        v-for="(bar, i) in BARS"
        :key="i"
        class="spinner-bar"
        :style="{
          transform: `rotate(${bar.rotate}deg) translate(0, -135%)`,
          animationDelay: bar.delay,
        }"
      />
    </span>
    <span v-if="label || $slots.default" class="spinner-label">
      <slot>{{ label }}</slot>
    </span>
  </span>
</template>

<style scoped lang="scss">
.geist-spinner {
  --spinner-size: 24px;
  --spinner-color: currentcolor;

  line-height: var(--leading-none);
  vertical-align: middle;
}

.spinner-wheel {
  position: relative;
  width: var(--spinner-size);
  height: var(--spinner-size);
}

.spinner-bar {
  position: absolute;
  top: 50%;
  left: 50%;

  width: calc(var(--spinner-size) * 0.08);
  height: calc(var(--spinner-size) * 0.25);
  margin-top: calc(var(--spinner-size) * -0.125);
  margin-left: calc(var(--spinner-size) * -0.04);
  border-radius: 0;

  opacity: 0.15;
  background-color: var(--spinner-color);

  animation: geist-spinner-fade 1.2s linear infinite;
}

.spinner-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

@keyframes geist-spinner-fade {
  0% {
    opacity: 1;
  }

  100% {
    opacity: 0.15;
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinner-bar {
    opacity: 0.4;
    animation: none;

    &:nth-child(3n) {
      opacity: 1;
    }
  }
}
</style>
