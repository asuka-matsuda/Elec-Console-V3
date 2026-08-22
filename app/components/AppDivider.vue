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
  &.has-accent-main {
    --divider-accent: var(--color-category-main);
  }

  &.has-accent-tool {
    --divider-accent: var(--color-category-tool);
  }

  &.has-accent-database {
    --divider-accent: var(--color-category-database);
  }

  &.has-accent-reference {
    --divider-accent: var(--color-category-reference);
  }

  &.has-accent-management {
    --divider-accent: var(--color-category-management);
  }

  &.has-accent-danger {
    --divider-accent: var(--color-status-danger);
  }

  &.has-accent-success {
    --divider-accent: var(--color-status-success);
  }

  &.has-accent-border {
    --divider-accent: var(--color-border);
  }

  &.has-accent-sidebar-border {
    --divider-accent: var(--sidebar-border);
  }

  // --- Orientation Modifiers (Horizontal) ---
  &--horizontal {
    transform-origin: center;

    width: 100%;
    height: var(--border-width-base);
    animation: divider-scale-x 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;

    &.is-type-solid {
      background: var(--color-border);
      // パルス発光用のData Flow（擬似要素）
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
          theme-color(var(--divider-accent, var(--color-category-main)), 80%),
          transparent
        );
        box-shadow: 0 0 var(--blur-md) var(--divider-accent, var(--color-category-main));
        animation: data-pulse-x 3s ease-in-out infinite;
      }
    }

    &.is-type-fade-center {
      background: linear-gradient(to right, transparent 0%, var(--divider-accent) 50%, transparent 100%);
    }

    &.is-type-fade-side {
      background: linear-gradient(to right, var(--divider-accent) 0%, transparent 100%);
    }
  }

  // --- Orientation Modifiers (Vertical) ---
  &--vertical {
    transform-origin: center;

    width: var(--border-width-base);
    height: auto;
    min-height: 100%;
    animation: divider-scale-y 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;

    &.is-type-solid {
      background: var(--color-border);
      // パルス発光用のData Flow（擬似要素）
      &::before {
        content: "";
        position: absolute;
        top: -30%;
        left: 0;
        width: 100%;
        height: 30%;
        background: linear-gradient(
          180deg,
          transparent,
          theme-color(var(--divider-accent, var(--color-category-main)), 80%),
          transparent
        );
        box-shadow: 0 0 var(--blur-md) var(--divider-accent, var(--color-category-main));
        animation: data-pulse-y 3s ease-in-out infinite;
      }
    }

    &.is-type-fade-center {
      background: linear-gradient(to bottom, transparent 0%, var(--divider-accent) 50%, transparent 100%);
    }

    &.is-type-fade-side {
      background: linear-gradient(to bottom, var(--divider-accent) 0%, transparent 100%);
    }
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
