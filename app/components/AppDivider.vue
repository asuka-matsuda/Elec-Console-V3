<script setup lang="ts">
/**
 * AppDivider
 * 画面やコンテンツの区切り線を表示するコンポーネント
 */
withDefaults(
  defineProps<{
    variant?:
      | "main"
      | "tool"
      | "database"
      | "reference"
      | "management"
      | "danger"
      | "success"
      | "border"
      | "sidebar-border";
    type?: "solid" | "fade-center" | "fade-side";
    vertical?: boolean;
  }>(),
  {
    variant: "main",
    type: "solid",
    vertical: false,
  },
);
</script>

<template>
  <div
    class="c-divider"
    :class="[
      `has-accent-${variant}`,
      `is-type-${type}`,
      {
        'c-divider--vertical': vertical,
        'c-divider--horizontal': !vertical,
      },
    ]"
  />
</template>

<style scoped lang="scss">
.c-divider {
  // --- Base Styles ---
  position: relative;

  // --- Base Styling ---
  overflow: hidden; // アニメーションの光がはみ出さないようにする
  flex-shrink: 0;
  box-shadow: var(--shadow-sink); // 彫り込まれた溝の影

  // --- Color Modifiers ---
  $accents: (
    "main": var(--color-category-main),
    "tool": var(--color-category-tool),
    "database": var(--color-category-database),
    "reference": var(--color-category-reference),
    "management": var(--color-category-management),
    "danger": var(--color-status-danger),
    "success": var(--color-status-success),
    "border": var(--color-border),
    "sidebar-border": var(--sidebar-border)
  );

  @each $name, $val in $accents {
    &.has-accent-#{$name} {
      --glow-color: #{$val};
    }
  }

  // --- Orientation Properties ---
  // Default (Horizontal)
  --divider-size-x: 100%;
  --divider-size-y: var(--border-width-base);
  --divider-min-h: auto;
  --anim-scale: divider-scale-x;
  --anim-pulse: data-pulse-x;
  --pulse-w: 30%;
  --pulse-h: 100%;
  --pulse-top: 0;
  --pulse-left: -30%;
  --grad-dir-fade: to right;
  --grad-dir-pulse: 90deg;

  &--vertical {
    --divider-size-x: var(--border-width-base);
    --divider-size-y: auto;
    --divider-min-h: 100%;
    --anim-scale: divider-scale-y;
    --anim-pulse: data-pulse-y;
    --pulse-w: 100%;
    --pulse-h: 30%;
    --pulse-top: -30%;
    --pulse-left: 0;
    --grad-dir-fade: to bottom;
    --grad-dir-pulse: 180deg;
  }

  // --- Base Styling & Animations ---
  transform-origin: center;
  width: var(--divider-size-x);
  height: var(--divider-size-y);
  min-height: var(--divider-min-h);
  animation: var(--anim-scale) 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;

  &.is-type-solid {
    background: var(--color-border);

    // パルス発光用のData Flow（擬似要素）
    &::before {
      content: "";
      position: absolute;
      top: var(--pulse-top);
      left: var(--pulse-left);
      width: var(--pulse-w);
      height: var(--pulse-h);
      background: linear-gradient(
        var(--grad-dir-pulse),
        transparent,
        theme-color(var(--glow-color, var(--color-category-main)), 80%),
        transparent
      );
      box-shadow: var(--shadow-glow-md);
      animation: var(--anim-pulse) 3s ease-in-out infinite;
    }
  }

  &.is-type-fade-center {
    background: linear-gradient(var(--grad-dir-fade), transparent 0%, var(--glow-color) 50%, transparent 100%);
  }

  &.is-type-fade-side {
    background: linear-gradient(var(--grad-dir-fade), var(--glow-color) 0%, transparent 100%);
  }

  // --- Keyframes ---
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

  @keyframes divider-scale-y {
    from {
      transform: scaleY(0);
      opacity: 0;
    }

    to {
      transform: scaleY(1);
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

    60% {
      transform: translateX(450%);
      opacity: 0;
    } // 100% + 300% travel + buffer
    100% {
      transform: translateX(450%);
      opacity: 0;
    }
  }

  @keyframes data-pulse-y {
    0% {
      transform: translateY(0);
      opacity: 0;
    }

    10% {
      opacity: 1;
    }

    50% {
      opacity: 1;
    }

    60% {
      transform: translateY(450%);
      opacity: 0;
    } // 100% + 300% travel + buffer
    100% {
      transform: translateY(450%);
      opacity: 0;
    }
  }
}
</style>
