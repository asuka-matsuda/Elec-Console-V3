<script setup lang="ts">
/**
 * AppButtonSuccess
 * 成功のアクションを示す緑のボタンコンポーネント
 */
import AppButton from "./AppButton.vue";
</script>

<template>
  <AppButton _variant="success" v-bind="$attrs">
    <slot />
  </AppButton>
</template>
