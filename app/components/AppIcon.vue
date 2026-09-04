<script setup lang="ts">
/**
 * AppIcon
 * プロジェクト内で使用される Feather Icons を軽量なSVGマップで表示するコンポーネントです。
 */
import { computed } from 'vue'

import type { IconName } from '~/constants/icons'
import { ICON_CONTENTS } from '~/constants/icons'

const props = defineProps<{
  name: IconName | string
  size?: 'sm' | 'md' | 'lg'
}>()

const iconInner = computed(() => {
  return ICON_CONTENTS[props.name] || ''
})
</script>

<template>
  <i
    class="c-icon"
    :class="[size ? `c-icon--${size}` : '']"
  >
    <svg
      v-if="iconInner"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      :class="`feather feather-${name}`"
      v-html="iconInner"
    />
  </i>
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
