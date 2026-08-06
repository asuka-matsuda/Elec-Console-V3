<script setup lang="ts">
import AppButton from './AppButton.vue'
</script>

<template>
  <AppButton _variant="secondary" v-bind="$attrs">
    <slot />
  </AppButton>
</template>
