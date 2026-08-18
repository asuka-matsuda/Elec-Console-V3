<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: "default" | "fade-side" | "fade-center";
    variant?: "main" | "tool" | "database" | "reference" | "management" | "danger" | "success";
    vertical?: boolean;
    animated?: boolean;
  }>(),
  {
    type: "fade-center",
    variant: "main",
    vertical: false,
    animated: true,
  },
);
</script>

<template>
  <div
    class="c-divider"
    :class="[
      `c-divider--${type}`,
      `has-accent-${variant}`,
      {
        'c-divider--vertical': vertical,
        'c-divider--horizontal': !vertical,
        'is-animated': animated,
      },
    ]"
    role="separator"
    :aria-orientation="vertical ? 'vertical' : 'horizontal'"
  />
</template>

<style scoped lang="scss">
.c-divider {
  position: relative;
  flex-shrink: 0;

  // Variants (Colors)
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

  // ==========================================
  // Types
  // ==========================================
  &--default {
    box-shadow: var(--shadow-sink); // 彫り込まれた溝の影
    overflow: hidden; // アニメーションの光がはみ出さないようにする

    &.c-divider--horizontal {
      width: 100%;
      height: var(--border-width-thick);
      border-top: var(--border-width-base) solid var(--color-border);
      border-bottom: 1px solid transparent;
      transform-origin: center;
      animation: divider-scale-x 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  }

  &--fade-side {
    width: 100%;
    height: var(--border-width-base);
    background: linear-gradient(
      90deg,
      var(--divider-accent, var(--color-border)) 0%,
      transparent 100%
    );
    opacity: 0.5;
  }

  &--fade-center {
    width: 100%;
    height: var(--border-width-base);
    background: linear-gradient(
      90deg,
      transparent 0%,
      var(--divider-accent, var(--color-border)) 50%,
      transparent 100%
    );
    box-shadow: 0 0 var(--blur-sm)
      theme-color(var(--divider-accent, var(--color-border)), 30%);
  }

  // ==========================================
  // Horizontal (水平) - Default
  // ==========================================
  &--horizontal {
    // パルス発光用（Data Flow）の擬似要素
    &.is-animated.c-divider--default::before {
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
      box-shadow: 0 0 var(--blur-md)
        var(--divider-accent, var(--color-category-main));
      animation: data-pulse-x 3s ease-in-out infinite;
    }
  }

  // ==========================================
  // Vertical (垂直)
  // ==========================================
  &--vertical {
    &.c-divider--default {
      width: var(--border-width-thick);
      height: auto;
      min-height: 100%;
      border-left: var(--border-width-base) solid var(--color-border);
      border-right: 1px solid transparent;
      margin: 0 var(--space-4);

      // Entrance Animation (縦に伸びる)
      transform-origin: center;
      animation: divider-scale-y 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    // パルス発光用（Data Flow）の擬似要素
    &.is-animated.c-divider--default::before {
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
      box-shadow: 0 0 var(--blur-md)
        var(--divider-accent, var(--color-category-main));
      animation: data-pulse-y 3s ease-in-out infinite;
    }
  }

  // ==========================================
  // Keyframes
  // ==========================================
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
    } // 休止時間
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
    }

    100% {
      transform: translateY(450%);
      opacity: 0;
    } // 休止時間
  }
}
</style>
