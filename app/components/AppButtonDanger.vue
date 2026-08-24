<script setup lang="ts">
/**
 * AppButtonDanger
 * 危険なアクションを示す赤いボタンコンポーネント
 */
import AppButton from "./AppButton.vue";
import type { AppButtonProps } from "./AppButton.vue";

defineProps<AppButtonProps>();
</script>

<template>
  <AppButton v-bind="$props" class="c-btn-danger">
    <slot />
  </AppButton>
</template>

<style scoped lang="scss">
.c-btn-danger {
  --btn-color: var(--color-status-danger);
}
</style>
