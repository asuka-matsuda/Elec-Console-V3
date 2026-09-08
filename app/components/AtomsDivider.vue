<script setup lang="ts">
/**
 * AtomsDivider
 * 画面やコンテンツの区切り線を表示する最小コンポーネント。
 * サイバー風のパルスアニメーションやグラデーションフェードに対応します。
 */
import { computed } from 'vue'

export interface AtomsDividerProps {
  color?: string
  type?: 'solid' | 'fade-center' | 'fade-side'
}

const {
  color,
  type = 'solid',
} = defineProps<AtomsDividerProps>()

const resolvedColor = computed(() => color || 'var(--theme-accent)')
</script>

<template>
  <div
    class="divider relative w-full h-px shrink-0 overflow-hidden"
    :class="`is-${type}`"
    :style="{ '--divider-color': resolvedColor }"
    role="separator"
    aria-orientation="horizontal"
  />
</template>

<style scoped lang="scss">
.divider {
  --glow-color: var(--divider-color);

  box-shadow: var(--shadow-sink);
  animation: divider-scale-x 0.6s var(--ease-smooth) forwards;

  // 1. ソリッド型（サイバーパルス光アニメーション）
  &.is-solid {
    background: var(--color-border);

    &::before {
      --glow-color: var(--divider-color);

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
      box-shadow: var(--shadow-glow-hover);

      animation: data-pulse-x 3s ease-in-out infinite;
    }
  }

  // 2. センターフェード型
  &.is-fade-center {
    background: linear-gradient(
      to right,
      transparent 0%,
      var(--divider-color) 50%,
      transparent 100%
    );
  }

  // 3. サイドフェード型
  &.is-fade-side {
    background: linear-gradient(
      to right,
      var(--divider-color) 0%,
      transparent 100%
    );
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

  10% {
    opacity: 1;
  }

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
