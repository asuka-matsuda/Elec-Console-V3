<script setup lang="ts">
/**
 * AppIconButton
 * アイコンのみのボタンを表示するコンポーネントです。
 */
withDefaults(
  defineProps<{
    /** The icon name */
    name: string;
    to?: string;
    href?: string;
    type?: "button" | "submit" | "reset";
    // eslint-disable-next-line vue/prop-name-casing
    _variant?: "primary" | "secondary" | "success" | "danger";
    size?: "sm" | "md" | "lg";
    disabled?: boolean;
  }>(),
  {
    type: "button",
    _variant: "primary",
    size: "md",
  }
);
</script>

<template>
  <AppButton
    :to="to"
    :href="href"
    :type="type"
    :_variant="_variant"
    :size="size"
    :disabled="disabled"
    icon-only
  >
    <AppIcon :name="name" />
  </AppButton>
</template>
