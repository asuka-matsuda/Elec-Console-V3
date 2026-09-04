<script setup lang="ts">
/**
 * AppDivider
 * 画面やコンテンツの区切り線を表示するコンポーネント。
 * サイバー風のパルスアニメーションやグラデーションフェードに対応します。
 */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?:
      | 'main'
      | 'tool'
      | 'database'
      | 'reference'
      | 'management'
      | 'danger'
      | 'success'
      | 'border'
    type?: 'solid' | 'fade-center' | 'fade-side'
    vertical?: boolean
  }>(),
  {
    variant: 'main',
    type: 'solid',
    vertical: false,
  },
)

const variantColorMap: Record<string, string> = {
  main: 'var(--theme-accent)',
  tool: 'var(--color-category-tool)',
  database: 'var(--color-category-database)',
  reference: 'var(--color-category-reference)',
  management: 'var(--color-category-management)',
  danger: 'var(--color-status-danger)',
  success: 'var(--color-status-success)',
  border: 'var(--color-border)',
}

const dividerColor = computed(
  () => variantColorMap[props.variant] || 'var(--theme-accent)',
)
</script>

<template>
  <div
    class="c-divider"
    :class="[
      `is-type-${type}`,
      vertical ? 'c-divider--vertical' : 'c-divider--horizontal',
    ]"
    :style="{ '--divider-color': dividerColor }"
    role="separator"
  />
</template>

<style scoped lang="scss">
.c-divider {
  --divider-color: var(--theme-accent);

  position: relative;
  overflow: hidden;
  flex-shrink: 0;

  @include shadow("sink");

  &--horizontal {
    width: 100%;
    height: 1px;
    animation: divider-scale-x 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  &--vertical {
    width: 1px;
    height: 100%;
    min-height: 1em;
  }

  // 1. ソリッド型（ダッシュボード等で走るサイバーパルス光アニメーション）
  &.is-type-solid {
    background: var(--color-border);

    &::before {
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
      box-shadow: 0 0 8px
        color-mix(in srgb, var(--divider-color) 60%, transparent);

      animation: data-pulse-x 3s ease-in-out infinite;
    }
  }

  // 2. センターフェード型
  &.is-type-fade-center {
    background: linear-gradient(
      to right,
      transparent 0%,
      var(--divider-color) 50%,
      transparent 100%
    );
  }

  // 3. サイドフェード型
  &.is-type-fade-side {
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
