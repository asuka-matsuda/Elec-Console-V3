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
  <AppButton v-bind="$props" style="--btn-color: var(--color-status-danger)">
    <slot />
  </AppButton>
</template>
