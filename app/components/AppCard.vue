<script setup lang="ts">
/**
 * AppCard
 * コンテンツをまとめるためのカード型コンポーネント
 */
import { computed, resolveComponent } from 'vue'

const props = defineProps<{
  to?: string
  href?: string
  disabled?: boolean
  title?: string
  icon?: string
  description?: string
}>()

const rootTag = computed(() => {
  if (props.to) return resolveComponent('NuxtLink')
  if (props.href) return 'a'

  return 'div'
})

const rootProps = computed(() => {
  if (props.disabled) return { tabindex: -1 }
  if (props.to) return { to: props.to }
  if (props.href) return { href: props.href }

  return {}
})

const handleClick = (e: MouseEvent) => {
  if (props.disabled) {
    e.preventDefault()
    e.stopImmediatePropagation()
  }
}
</script>

<template>
  <component
    :is="rootTag"
    v-bind="rootProps"
    class="c-card"
    :class="{ 'is-disabled': disabled }"
    @click="handleClick"
  >
    <div v-if="$slots.header || title || icon || $slots.description || description" class="c-card__header-group">
      <div v-if="$slots.header || title || icon" class="c-card__header">
        <slot name="header">
          <AppIcon v-if="icon" :name="icon" class="c-card__icon" />
          <span v-if="title" class="c-card__title">{{ title }}</span>
        </slot>
      </div>
      <div v-if="$slots.description || description" class="c-card__desc">
        <slot name="description">
          {{ description }}
        </slot>
      </div>
    </div>
    <div v-if="$slots.default" class="c-card__content">
      <slot />
    </div>
  </component>
</template>

<style scoped lang="scss">
.c-card {
  @include flex-start-stretch($direction: column);

  position: relative;
  overflow: hidden;
  gap: var(--space-card-gap);
  padding: var(--space-card-pad);

  @include border-base;
  @include state-base;

  &:is(a, button) {
    @include click-enabled;

    &:is(:disabled, .is-disabled) {
      @include disabled;
    }

    &:not(:is(:disabled, .is-disabled)) {
      &:hover {
        @include state-hover(var(--theme-accent), "md");
      }

      &:focus-visible {
        @include state-focus(var(--theme-accent), "md");
      }

      &:active {
        @include state-active(var(--theme-accent), "md");
      }
    }
  }

  &__header-group {
    @include flex-start-stretch($direction: column);

    gap: var(--space-1);
  }

  &__header {
    @include text-title("sm");
    @include flex-start-start;

    gap: var(--space-1);
    color: var(--theme-accent);
    word-break: keep-all;
    line-break: strict;
    overflow-wrap: anywhere;
  }

  &__icon {
    flex-shrink: 0;
  }

  &__desc {
    @include text-desc;
  }

  &__content {
    @include flex-start-stretch($direction: column);

    flex: 1;
  }
}
</style>
