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
  <AppButton v-bind="$props" style="--btn-color: var(--color-status-neutral)">
    <slot />
  </AppButton>
</template>
