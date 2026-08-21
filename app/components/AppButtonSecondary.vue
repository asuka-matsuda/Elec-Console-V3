<script setup lang="ts">
/**
 * AppButtonSecondary
 * 補助的なアクションを示すセカンダリボタンコンポーネント
 */
import AppButton from "./AppButton.vue";
</script>

<template>
  <AppButton _variant="secondary" v-bind="$attrs">
    <slot />
  </AppButton>
</template>
