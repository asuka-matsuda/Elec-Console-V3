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
    <slot />
  </component>
</template>

<style scoped lang="scss">
.c-card {
  position: relative;

  @include flex-start-stretch($direction: column);

  gap: var(--space-card-gap);
  width: 100%;
  padding: var(--space-card-pad);

  @include border-base;
  @include state-base;

  &:is(a) {
    @include click-enabled;

    &:hover:not(.is-disabled) {
      @include state-hover(var(--theme-accent));
    }

    &:focus-visible:not(.is-disabled) {
      @include state-focus(var(--theme-accent));
    }

    &:active:not(.is-disabled) {
      @include state-active(var(--theme-accent));
    }
  }

  &.is-disabled {
    @include disabled;
  }
}
</style>
