<script setup lang="ts">
/**
 * AppButtonSecondary
 * 補助的なアクションを示すセカンダリボタンコンポーネント
 */
import AppButton from "./AppButton.vue";
import type { AppButtonProps } from "./AppButton.vue";

defineProps<AppButtonProps>();
</script>

<template>
  <AppButton v-bind="$props" class="c-btn-secondary">
    <slot />
  </AppButton>
</template>

<style scoped lang="scss">
.c-btn-secondary {
  --btn-color: var(--color-status-neutral);
}
</style>
