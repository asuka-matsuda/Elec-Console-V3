<script setup lang="ts">
/**
 * Divider
 * [Atoms] 画面やコンテンツの区切り線を表示する最小コンポーネント。
 * 水平方向のサイバーパルス光アニメーション、垂直方向の静的区切り、グラデーションフェードに対応します。
 */
import { computed } from 'vue'

import type { DividerProps } from '~/types/components'

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

  // 1. ソリッド型（左端アクセントから右へ緩やかに馴染む微細グラデーション）
  &.is-solid {
    background:
      linear-gradient(
        to right,
        color-mix(in srgb, var(--divider-color) 45%, var(--color-border)) 0%,
        color-mix(in srgb, var(--divider-color) 15%, var(--color-border)) 40%,
        var(--color-border) 100%
      );
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
      left: -50%;

      width: 50%;
      height: 100%;

      background: linear-gradient(
        90deg,
        transparent 0%,
        color-mix(in srgb, var(--divider-color) 55%, transparent) 50%,
        transparent 100%
      );

      animation: data-sheen 4.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
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

@keyframes data-sheen {
  0%,
  20% {
    transform: translateX(0);
    opacity: 0;
  }

  35% {
    opacity: 0.85;
  }

  65%,
  100% {
    transform: translateX(350%);
    opacity: 0;
  }
}
</style>
