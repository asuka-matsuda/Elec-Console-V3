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
  <AppButton v-bind="$props" _variant="danger">
    <slot />
  </AppButton>
</template>
