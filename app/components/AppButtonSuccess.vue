<script setup lang="ts">
import AppButton from './AppButton.vue'
</script>

<template>
  <AppButton _variant="success" v-bind="$attrs">
    <slot />
  </AppButton>
</template>
