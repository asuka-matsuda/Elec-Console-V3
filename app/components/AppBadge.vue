<script setup lang="ts">
export type BadgeVariant =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "tool"
  | "database"
  | "reference"
  | "management";

withDefaults(
  defineProps<{
    variant?: BadgeVariant;
    size?: "sm" | "md";
  }>(),
  {
    variant: "neutral",
    size: "sm",
  },
);
</script>

<template>
  <span class="c-badge" :class="[`c-badge--${variant}`, `c-badge--${size}`]">
    <slot />
  </span>
</template>

<style scoped lang="scss">
.c-badge {
  // CSS Custom Properties for theme values
  --badge-color: var(--color-text-main);
  --badge-border: var(--color-border);
  --badge-shadow: transparent;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: calc(var(--space-1) / 2) var(--space-1);
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  color: var(--badge-color);
  border: var(--border-width-base) solid var(--badge-border);
  box-shadow:
    inset 0 0 var(--blur-sm) var(--badge-shadow),
    0 0 var(--blur-md) var(--badge-shadow);
  @include cyber-text-glow(100%, var(--blur-sm), var(--badge-color));
  user-select: none;
  line-height: var(--line-height-tight);
  white-space: nowrap;
  transition: var(--transition-base);

  &--md {
    padding: var(--space-1) var(--space-2);
    font-size: var(--text-xs);
  }

  $variants: (
    "primary": "--color-category-main",
    "success": "--color-status-success",
    "warning": "--color-status-warning",
    "danger": "--color-status-danger",
    "tool": "--color-category-tool",
    "database": "--color-category-database",
    "reference": "--color-category-reference",
    "management": "--color-category-management",
  );

  @each $name, $var in $variants {
    &--#{$name} {
      --badge-color: var(#{$var});
      --badge-border: #{theme-color(var(#{$var}), 60%)};
      --badge-shadow: #{theme-color(var(#{$var}), 30%)};
    }
  }
}
</style>
