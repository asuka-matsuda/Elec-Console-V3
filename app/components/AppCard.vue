<script setup lang="ts">
/**
 * AppCard
 * コンテンツをまとめるためのカード型コンポーネント
 */
import { computed, useSlots } from 'vue'

const props = defineProps<{
  to?: string
  href?: string
  disabled?: boolean
  title?: string
  icon?: string
  description?: string
}>()

const slots = useSlots()

const isClickable = computed(() => !props.disabled && (!!props.to || !!props.href))

const rootTag = computed(() => {
  if (!isClickable.value) return 'div'
  if (props.to) return 'NuxtLink'

  return 'a'
})

const rootProps = computed(() => {
  if (!isClickable.value) return {}
  if (props.to) return { to: props.to }

  return { href: props.href }
})

const hasHeader = computed(() => !!(slots.header || props.title || props.icon))
const hasDescription = computed(() => !!(slots.description || props.description))
</script>

<template>
  <component
    :is="rootTag"
    v-bind="rootProps"
    class="c-card"
    :class="{
      'is-clickable': isClickable,
      'is-disabled': disabled,
    }"
  >
    <div v-if="hasHeader || hasDescription" class="c-card__header-group">
      <div v-if="hasHeader" class="c-card__header">
        <slot name="header">
          <AppIcon v-if="icon" :name="icon" class="c-card__icon" />
          <span v-if="title" class="c-card__title">{{ title }}</span>
        </slot>
      </div>

      <div v-if="hasDescription" class="c-card__desc">
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

  &.is-clickable {
    @include click-enabled;

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

  &.is-disabled {
    @include disabled;
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
    flex: 1;
  }
}
</style>
