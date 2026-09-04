<script setup lang="ts">
/**
 * AppCard
 * 単一の情報単位やリンク先をまとめるためのカード型コンポーネント。
 * タイトル、説明文、およびコンテンツで構成されます。
 */
import { computed, useSlots } from 'vue'

import { NuxtLink } from '#components'

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
  if (props.disabled) return 'button'
  if (!isClickable.value) return 'div'
  if (props.to) return NuxtLink

  return 'a'
})

const rootProps = computed(() => {
  if (props.disabled) return { disabled: true }
  if (!isClickable.value) return {}
  if (props.to) return { to: props.to }

  return { href: props.href }
})

const hasHeader = computed(() => !!slots.header)
const hasTitle = computed(() => !!(slots.title || props.title || props.icon))
const hasDescription = computed(() => !!(slots.description || props.description))
</script>

<template>
  <component
    :is="rootTag"
    v-bind="rootProps"
    class="c-card"
    :class="{
      'is-clickable': isClickable,
    }"
  >
    <header v-if="hasHeader || hasTitle || hasDescription" class="c-card__header">
      <slot name="header">
        <div v-if="hasTitle" class="c-card__title">
          <slot name="title">
            <AppIcon v-if="icon" :name="icon" />
            <span v-if="title">{{ title }}</span>
          </slot>
        </div>

        <div v-if="hasDescription" class="c-card__desc">
          <slot name="description">
            {{ description }}
          </slot>
        </div>
      </slot>
    </header>

    <slot />
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

  &:disabled {
    @include disabled;
  }

  &__header,
  &__title-group {
    @include flex-start-stretch($direction: column);

    gap: var(--space-1);
  }

  &__title {
    @include text-title("sm");
    @include flex-start-start;

    gap: var(--space-1);

    color: var(--theme-accent);
    word-break: keep-all;
    line-break: strict;
    overflow-wrap: anywhere;
  }

  &__desc {
    @include text-desc;
  }
}
</style>
