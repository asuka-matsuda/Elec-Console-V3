<script setup lang="ts">
/**
 * MoleculesIconButton
 * [Molecules] AtomsButton と AtomsIcon を組み合わせた、アイコン専用ボタンコンポーネント
 */
import type { MoleculesIconButtonProps } from '~/types/components'

const props = withDefaults(defineProps<MoleculesIconButtonProps>(), {
  type: 'button',
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
  width: 2.6em;
  min-width: 2.6em;

  :deep(.icon),
  .icon {
    width: 1.2em;
    height: 1.2em;

    svg {
      width: 100%;
      height: 100%;
    }
  }
}
</style>
