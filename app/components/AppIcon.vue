<script setup lang="ts">
/**
 * AppIcon
 * feather-iconsを使用したアイコンを表示するコンポーネントです。
 */
import feather from "feather-icons";
import { computed } from "vue";

const props = defineProps<{
  name: string;
  size?: "sm" | "md" | "lg";
}>();

const svgContent = computed(() => {
  if (feather.icons[props.name as keyof typeof feather.icons]) {
    return feather.icons[props.name as keyof typeof feather.icons].toSvg();
  }

  return "";
});
</script>

<template>
  <i
    class="c-icon"
    :class="[size ? `c-icon--${size}` : '']"
    v-html="svgContent"
  />
</template>

<style scoped lang="scss">
.c-icon {
  @include flex-center-center($is-inline: true);

  :deep(svg) {
    width: 100%;
    height: 100%;
  }

  &--sm {
    width: 14px;
    height: 14px;
  }

  &--md {
    width: 18px;
    height: 18px;
  }

  &--lg {
    width: 24px;
    height: 24px;
  }
}
</style>
