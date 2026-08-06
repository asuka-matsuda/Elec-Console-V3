<script setup lang="ts">
export type BadgeVariant = 
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'tool'
  | 'database'
  | 'reference'
  | 'management'

withDefaults(defineProps<{
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  glow?: boolean
}>(), {
  variant: 'neutral',
  size: 'md',
  glow: false
})
</script>

<template>
  <span 
    class="c-badge" 
    :class="[
      `c-badge--${variant}`,
      `c-badge--${size}`,
      { 'c-badge--glow': glow }
    ]"
  >
    <slot />
  </span>
</template>

<style scoped lang="scss">
.c-badge {
  // CSS Custom Properties for theme values
  --badge-color: var(--color-text-main);
  --badge-border: #{glass-color(30%)};
  --badge-shadow: #{glass-color(10%)};
  
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-1) var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  color: var(--badge-color);
  background-color: transparent; // Ensure transparency
  border: var(--border-width-base) solid var(--badge-border);
  box-shadow: inset 0 0 var(--blur-sm) var(--badge-shadow);
  border-radius: 0; // Cyberpunk sharp edges
  user-select: none;
  line-height: var(--line-height-tight);
  white-space: nowrap;
  transition: var(--transition-base);

  // --- Sizes ---
  &--sm {
    padding: calc(var(--space-1) / 2) var(--space-1);
    font-size: var(--text-2xs);
  }

  // --- Glow Effect ---
  &--glow {
    box-shadow: 
      inset 0 0 var(--blur-sm) var(--badge-shadow),
      0 0 var(--blur-md) var(--badge-shadow);
    text-shadow: 0 0 4px var(--badge-color);
  }

  // --- Variants (using interpolation for SCSS functions inside custom properties) ---
  &--primary {
    --badge-color: var(--color-category-main);
    --badge-border: #{theme-color(var(--color-category-main), 60%)};
    --badge-shadow: #{theme-color(var(--color-category-main), 30%)};
  }
  
  &--success {
    --badge-color: var(--color-status-success);
    --badge-border: #{theme-color(var(--color-status-success), 60%)};
    --badge-shadow: #{theme-color(var(--color-status-success), 30%)};
  }

  &--warning {
    --badge-color: var(--color-status-warning);
    --badge-border: #{theme-color(var(--color-status-warning), 60%)};
    --badge-shadow: #{theme-color(var(--color-status-warning), 30%)};
  }

  &--danger {
    --badge-color: var(--color-status-danger);
    --badge-border: #{theme-color(var(--color-status-danger), 60%)};
    --badge-shadow: #{theme-color(var(--color-status-danger), 30%)};
  }

  &--tool {
    --badge-color: var(--color-category-tool);
    --badge-border: #{theme-color(var(--color-category-tool), 60%)};
    --badge-shadow: #{theme-color(var(--color-category-tool), 30%)};
  }

  &--database {
    --badge-color: var(--color-category-database);
    --badge-border: #{theme-color(var(--color-category-database), 60%)};
    --badge-shadow: #{theme-color(var(--color-category-database), 30%)};
  }

  &--reference {
    --badge-color: var(--color-category-reference);
    --badge-border: #{theme-color(var(--color-category-reference), 60%)};
    --badge-shadow: #{theme-color(var(--color-category-reference), 30%)};
  }

  &--management {
    --badge-color: var(--color-category-management);
    --badge-border: #{theme-color(var(--color-category-management), 60%)};
    --badge-shadow: #{theme-color(var(--color-category-management), 30%)};
  }
}
</style>
