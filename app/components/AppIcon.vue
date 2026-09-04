<script setup lang="ts">
/**
 * AppIcon
 * feather-iconsを使用したアイコンを表示するコンポーネントです。
 */
import feather from 'feather-icons'
import { computed } from 'vue'

const props = defineProps<{
  name: string
  size?: 'sm' | 'md' | 'lg'
}>()

const svgContent = computed(() => {
  if (feather.icons[props.name as keyof typeof feather.icons]) {
    return feather.icons[props.name as keyof typeof feather.icons].toSvg()
  }

  return ''
})
</script>

<template>
  <i
    class="c-icon"
    :class="[size ? `c-icon--${size}` : '']"
    v-html="svgContent"
  />
</template>

<style scoped lang="scss">
.c-icon {
  @include flex-center-center($is-inline: true);

  flex-shrink: 0;

  :deep(svg) {
    width: 100%;
    height: 100%;
  }

  &--sm {
    width: var(--icon-size-sm);
    height: var(--icon-size-sm);
  }

  &--md {
    width: var(--icon-size-md);
    height: var(--icon-size-md);
  }

  &--lg {
    width: var(--icon-size-lg);
    height: var(--icon-size-lg);
  }
}
</style>
