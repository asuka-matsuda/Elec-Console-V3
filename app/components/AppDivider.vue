<script setup lang="ts">
/**
 * AppDivider
 * 画面やコンテンツの区切り線を表示するコンポーネント
 */
withDefaults(
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
      | 'sidebar-border'
    type?: 'solid' | 'fade-center' | 'fade-side'
    vertical?: boolean
  }>(),
  {
    variant: 'main',
    type: 'solid',
    vertical: false,
  },
)
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
  $accents: (
    "main": var(--theme-accent),
    "tool": var(--color-category-tool),
    "database": var(--color-category-database),
    "reference": var(--color-category-reference),
    "management": var(--color-category-management),
    "danger": var(--color-status-danger),
    "success": var(--color-status-success),
    "border": var(--color-border),
    "sidebar-border": var(--sidebar-border),
  );

  --divider-size-x: 100%;
  --divider-size-y: var(--border-width-base);
  --divider-min-h: auto;
  --pulse-w: 30%;
  --pulse-h: 100%;
  --pulse-top: 0;
  --pulse-left: -30%;
  --grad-dir-fade: to right;
  --grad-dir-pulse: 90deg;

  position: relative;
  transform-origin: center;

  overflow: hidden;
  flex-shrink: 0;

  width: var(--divider-size-x);
  height: var(--divider-size-y);
  min-height: var(--divider-min-h);

  @include shadow("sink");

  &--horizontal {
    width: 100%;
    height: 1px;
    animation: divider-scale-x 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;

    &.is-type-solid::before {
      animation: data-pulse-x 3s ease-in-out infinite;
    }
  }

  &--vertical {
    --divider-size-x: var(--border-width-base);
    --divider-size-y: auto;
    --divider-min-h: 100%;
    --pulse-w: 100%;
    --pulse-h: 30%;
    --pulse-top: -30%;
    --pulse-left: 0;
    --grad-dir-fade: to bottom;
    --grad-dir-pulse: 180deg;

    animation: divider-scale-y 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;

    &.is-type-solid::before {
      animation: data-pulse-y 3s ease-in-out infinite;
    }
  }

  &.is-type-solid {
    background: var(--color-border);

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
        color-mix(in srgb, var(--theme-accent) 80%, transparent),
        transparent
      );

      box-shadow: 0 0 8px color-mix(in srgb, var(--theme-accent) 60%, transparent);
    }
  }

  &.is-type-fade-center {
    background: linear-gradient(
      var(--grad-dir-fade),
      transparent 0%,
      var(--glow-color) 50%,
      transparent 100%
    );
  }

  &.is-type-fade-side {
    background: linear-gradient(
      var(--grad-dir-fade),
      var(--glow-color) 0%,
      transparent 100%
    );
  }

  @each $name, $val in $accents {
    &.has-accent-#{$name} {
      --glow-color: #{$val};
    }
  }

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
    }

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
    }

    100% {
      transform: translateY(450%);
      opacity: 0;
    }
  }
}
</style>
