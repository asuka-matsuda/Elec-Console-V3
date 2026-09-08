<script setup lang="ts">
import type { AppIconButtonProps } from '~/types/components'

import AppButton from './AppButton.vue'

const props = withDefaults(defineProps<AppIconButtonProps>(), {
  type: 'button',
  size: 'md',
  variant: 'primary',
})
</script>

<template>
  <AppButton v-bind="props" class="icon-btn">
    <AppIcon :name="name" />
  </AppButton>
</template>

<style scoped lang="scss">
.icon-btn {
  width: var(--size-control-sm);
  padding: 0;

  :deep(.icon),
  .icon {
    width: 18px;
    height: 18px;

    svg {
      width: 100%;
      height: 100%;
    }
  }

  &.btn--md {
    width: var(--size-control-md);

    :deep(.icon),
    .icon {
      width: 22px;
      height: 22px;
    }
  }
}
</style>
