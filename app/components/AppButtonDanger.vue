<script setup lang="ts">
/**
 * AppButtonDanger
 * 危険なアクションを示す赤いボタンコンポーネント
 */
import AppButton from "./AppButton.vue";
</script>

<template>
  <AppButton _variant="danger" v-bind="$attrs">
    <slot />
  </AppButton>
</template>
