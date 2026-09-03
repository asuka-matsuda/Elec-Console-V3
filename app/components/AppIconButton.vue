<script setup lang="ts">
import type { BaseButtonProps } from '~/types/components'

import AppButton from './AppButton.vue'

export interface AppIconButtonProps extends BaseButtonProps {
  name: string
}

const props = withDefaults(defineProps<AppIconButtonProps>(), {
  type: 'button',
  size: 'md',
  variant: 'primary',
})
</script>

<template>
  <AppButton v-bind="props" class="c-icon-btn">
    <AppIcon :name="name" />
  </AppButton>
</template>

<style scoped lang="scss">
.c-icon-btn {
  width: var(--size-control-sm);
  padding: 0;

  :deep(.c-icon),
  .c-icon {
    width: 18px;
    height: 18px;

    svg {
      width: 100%;
      height: 100%;
    }
  }

  &.c-btn--md {
    width: var(--size-control-md);

    :deep(.c-icon),
    .c-icon {
      width: 22px;
      height: 22px;
    }
  }
}
</style>
