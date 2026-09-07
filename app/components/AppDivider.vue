<script setup lang="ts">
/**
 * AppDivider
 * 画面やコンテンツの区切り線を表示するコンポーネント。
 * サイバー風のパルスアニメーションやグラデーションフェードに対応します。
 */
import { computed } from 'vue'

const {
  color,
  variant = 'main',
  type = 'solid',
  vertical = false,
} = defineProps<{
  color?: string
  variant?:
    | 'main'
    | 'tool'
    | 'database'
    | 'reference'
    | 'management'
    | 'border'
    | (string & {})
  type?: 'solid' | 'fade-center' | 'fade-side' | 'default'
  vertical?: boolean
}>()

const variantColorMap: Record<string, string> = {
  main: 'var(--theme-accent)',
  tool: 'var(--color-category-tool)',
  database: 'var(--color-category-database)',
  reference: 'var(--color-category-reference)',
  management: 'var(--color-category-management)',
  border: 'var(--color-border)',
}

const resolvedColor = computed(
  () => color || variantColorMap[variant] || 'var(--theme-accent)',
)

const normalizedType = computed(() => (type === 'default' ? 'solid' : type))
</script>

<template>
  <div
    class="c-divider"
    :class="[
      `is-${normalizedType}`,
      { 'is-vertical': vertical },
    ]"
    :style="{ '--divider-color': resolvedColor }"
    role="separator"
    :aria-orientation="vertical ? 'vertical' : 'horizontal'"
  />
</template>

<style scoped lang="scss">
.c-divider {
  --divider-color: var(--theme-accent);
  --glow-color: var(--divider-color);

  position: relative;

  overflow: hidden;
  flex-shrink: 0;

  // デフォルト: 横向き (Horizontal)
  width: 100%;
  height: 1px;

  box-shadow: var(--shadow-sink);

  animation: divider-scale-x 0.6s var(--ease-smooth) forwards;

  // 縦向き (Vertical)
  &.is-vertical {
    width: 1px;
    height: 100%;
    min-height: 1em;
    animation: none;
  }

  // 1. ソリッド型（ダッシュボード等で走るサイバーパルス光アニメーション）
  &.is-solid {
    background: var(--color-border);

    &:not(.is-vertical)::before {
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
    background: linear-gradient(
      to right,
      var(--divider-color) 0%,
      transparent 100%
    );

    &.is-vertical {
      background: linear-gradient(
        to bottom,
        var(--divider-color) 0%,
        transparent 100%
      );
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
