<script setup lang="ts">
/**
 * AppIconButton
 * アイコンのみのボタンを表示するコンポーネントです。
 */
import type { AppButtonProps } from "./AppButton.vue";

interface Props extends AppButtonProps {
  /** The icon name */
  name: string;
}

const props = withDefaults(
  defineProps<Props>(),
  {
    type: "button",
    size: "md",
    iconOnly: true,
  }
);
</script>

<template>
  <AppButton
    v-bind="props"
    class="c-icon-button"
  >
    <AppIcon :name="name" />
  </AppButton>
</template>
