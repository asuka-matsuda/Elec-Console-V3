<script setup lang="ts">
/**
 * MoleculesIconButton
 * [Molecules] AtomsButton と AtomsIcon を組み合わせた、アイコン専用ボタンコンポーネント
 */
import type { MoleculesIconButtonProps } from '~/types/components'

const props = withDefaults(defineProps<MoleculesIconButtonProps>(), {
  type: 'button',
  size: 'md',
  variant: 'primary',
})
</script>

<template>
  <AtomsButton v-bind="props" class="p-0 icon-btn">
    <AtomsIcon :name="name" />
  </AtomsButton>
</template>

<style scoped lang="scss">
.icon-btn {
  width: var(--size-control-sm);

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
