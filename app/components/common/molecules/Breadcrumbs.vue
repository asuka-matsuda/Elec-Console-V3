<script setup lang="ts">
import type { BreadcrumbsProps } from '~/types/components'

withDefaults(defineProps<BreadcrumbsProps>(), {
  items: () => [],
  cursor: true,
})
</script>

<template>
  <nav v-if="items && items.length > 0" class="breadcrumbs">
    <ol class="flex items-center gap-inline-gap">
      <li v-for="(item, index) in items" :key="`${item.text}-${index}`" class="flex items-center gap-inline-gap breadcrumb-item" :class="{ 'is-active': index === items.length - 1, 'is-disabled': item.disabled, 'has-cursor': cursor && index === items.length - 1 }">
        <NuxtLink v-if="item.to && !item.disabled && index < items.length - 1" :to="item.to" class="breadcrumb-text is-link">{{ item.text }}</NuxtLink>
        <span v-else class="breadcrumb-text">{{ item.text }}</span>

        <span v-if="index < items.length - 1" class="inline-flex items-center justify-center breadcrumb-separator">
          <template v-if="separator">
            {{ separator }}
          </template>
          <Icon v-else name="chevron-right" size="sm" />
        </span>
      </li>
    </ol>
  </nav>
</template>

<style scoped lang="scss">
.breadcrumbs {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-base);
  letter-spacing: var(--tracking-wide);
  white-space: nowrap;
}

.breadcrumb-item {
  color: var(--color-text-muted);

  &.is-active {
    font-weight: var(--font-weight-medium);
    color: var(--theme-accent);

    &.has-cursor::after {
      content: "";

      width: var(--space-1);
      height: var(--space-3);
      margin-inline-start: var(--space-1);

      background-color: var(--theme-accent);

      animation: ui-cursor-blink 1s step-end infinite;
    }
  }

  &.is-disabled {
    @include state-disabled;
  }
}

.breadcrumb-text {
  color: inherit;

  &.is-link {
    text-decoration: none;
    transition: color var(--duration-fast) var(--ease-base);

    &:hover {
      color: var(--color-text-main);
    }

    &:focus-visible {
      outline: var(--border-width-base) solid var(--color-focus-ring);
      outline-offset: 2px;
    }
  }
}

.breadcrumb-separator {
  color: color-mix(in srgb, var(--theme-accent) 60%, transparent);
}

@keyframes ui-cursor-blink {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0;
  }
}
</style>
