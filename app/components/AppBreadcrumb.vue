<script setup lang="ts">
export type BreadcrumbItem = {
  text: string;
  href?: string;
};

defineProps<{
  items: BreadcrumbItem[];
}>();
</script>

<template>
  <nav class="c-breadcrumb" aria-label="Breadcrumb">
    <ol class="c-breadcrumb__list">
      <li
        v-for="(item, index) in items"
        :key="index"
        class="c-breadcrumb__item"
      >
        <!-- Not the last item -->
        <template v-if="index < items.length - 1">
          <NuxtLink v-if="item.href" :to="item.href" class="c-breadcrumb__link">
            {{ item.text }}
          </NuxtLink>
          <span v-else class="c-breadcrumb__text">{{ item.text }}</span>
        </template>

        <!-- Last item (Current Page) -->
        <span v-else class="c-breadcrumb__current" aria-current="page">
          {{ item.text }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<style scoped lang="scss">
.c-breadcrumb {
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.1em;

  &__list {
    position: relative;
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    padding: var(--space-4) var(--space-5) var(--space-2) var(--space-4);
    margin: 0;
    list-style: none;

    @include ui-surface();

    // The SYS.LOC label
    &::after {
      position: absolute;
      top: var(--space-1);
      left: 6px;
      font-size: 9px;
      font-weight: var(--font-weight-bold);
      color: var(--color-category-main);
      content: "SYS.LOC";
      opacity: 0.9;
      @include cyber-text-glow(50%, var(--blur-sm), var(--color-category-main));
    }
  }

  &__item {
    display: flex;
    align-items: center;

    // The separator »
    &:not(:last-child)::after {
      margin: 0 var(--space-3);
      font-size: var(--text-xs);
      color: color-mix(in srgb, var(--color-category-main) 60%, transparent);
      content: "»";
    }
  }

  &__link,
  &__text {
    display: flex;
    align-items: center;
    font-size: var(--text-xs);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-muted);
    text-decoration: none;
    transition: var(--transition-base);
  }

  &__link {
    &:hover {
      color: var(--color-text-main);
      text-shadow: 0 0 var(--blur-md) theme-color(var(--color-text-main), 50%);
    }
  }

  // Current page acts as the page title (h1 equivalent visually)
  &__current {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    font-size: var(--text-md); // Larger font size for the active page title
    font-weight: var(--font-weight-bold);
    color: var(--color-category-main);
    line-height: 1;
    margin-left: var(--space-1);

    @include cyber-text-glow(60%, var(--blur-md), var(--color-category-main));
    @include ui-blinking-cursor(var(--space-2), var(--space-5), currentcolor);
  }
}
</style>
