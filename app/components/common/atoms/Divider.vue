<script setup lang="ts">
/**
 * Divider
 * [Atom] 画面やコンテンツの区切り線を表示する最小コンポーネント。
 * 水平方向のサイバーパルス光アニメーション、垂直方向の静的区切り、グラデーションフェードに対応します。
 */
import { computed } from 'vue'

import type { DividerProps } from '~/types/components'

export type { DividerProps }

const {
  color,
  type = 'solid',
  orientation = 'horizontal',
  animated = true,
} = defineProps<DividerProps>()

const resolvedColor = computed(() => color || 'var(--theme-accent)')
</script>

<template>
  <hr
    class="divider relative shrink-0 overflow-hidden"
    :class="[
      orientation === 'horizontal'
        ? 'w-full h-px'
        : 'w-px h-full min-h-[1em] self-stretch',
      `is-${type}`,
      `is-${orientation}`,
      { 'is-animated': animated && orientation === 'horizontal' },
    ]"
    :style="{ '--divider-color': resolvedColor }"
  >
</template>

<style scoped lang="scss">
.divider {
  --glow-color: var(--divider-color);

  border: none;

  // 1. ソリッド型
  &.is-solid {
    background: color-mix(in srgb, var(--divider-color) 20%, var(--color-border));
    box-shadow: var(--shadow-sink);
  }

  // 2. センターフェード型
  &.is-fade-center {
    &.is-horizontal {
      background: linear-gradient(
        to right,
        transparent 0%,
        var(--divider-color) 50%,
        transparent 100%
      );
    }

    &.is-vertical {
      background: linear-gradient(
        to bottom,
        transparent 0%,
        var(--divider-color) 50%,
        transparent 100%
      );
    }
  }

  // 3. サイドフェード型
  &.is-fade-side {
    &.is-horizontal {
      background: linear-gradient(
        to right,
        var(--divider-color) 0%,
        transparent 100%
      );
    }

    &.is-vertical {
      background: linear-gradient(
        to bottom,
        var(--divider-color) 0%,
        transparent 100%
      );
    }
  }
}

// アニメーション有効時（設定ON かつ OS視覚効果抑制なし）のみアニメーションを付与
@media (prefers-reduced-motion: no-preference) {
  :root:not([data-animation="off"]) .divider.is-horizontal.is-animated {
    transform-origin: center;
    animation: divider-scale-x 0.6s var(--ease-smooth) forwards;

    &.is-solid::before {
      content: "";

      position: absolute;
      top: 0;
      left: -30%;

      width: 30%;
      height: 100%;

      background: linear-gradient(
        90deg,
        transparent,
        color-mix(in srgb, var(--divider-color) 80%, transparent),
        transparent
      );
      box-shadow: var(--shadow-glow-sm);

      animation: data-pulse-x 3s ease-in-out infinite;
    }
  }
}

// アニメーション定義
@keyframes divider-scale-x {
  from {
    transform: scaleX(0);
    opacity: 0;
  }

  to {
    transform: scaleX(1);
    opacity: 1;
  }
}

@keyframes data-pulse-x {
  0% {
    transform: translateX(0);
    opacity: 0;
  }

  10%,
  50% {
    opacity: 1;
  }

  60%,
  100% {
    transform: translateX(450%);
    opacity: 0;
  }
}
</style>
