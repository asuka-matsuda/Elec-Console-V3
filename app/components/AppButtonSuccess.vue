<script setup lang="ts">
/**
 * AppButtonSuccess
 * 成功のアクションを示す緑のボタンコンポーネント
 */
import AppButton from "./AppButton.vue";
import type { AppButtonProps } from "./AppButton.vue";

defineProps<AppButtonProps>();
</script>

<template>
  <AppButton v-bind="$props" class="c-btn-success">
    <slot />
  </AppButton>
</template>

<style scoped lang="scss">
.c-btn-success {
  --btn-color: var(--color-status-success);
}
</style>
