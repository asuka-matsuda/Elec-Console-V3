<script setup lang="ts">
import { computed } from "vue";
import { useHead } from "#app";
import { useSettings } from "~/composables/useSettings";

const { 
  themeMode, 
  baseBgStyle,
  solidColor,
  gradientColor1,
  gradientColor2,
  auroraColor1,
  auroraColor2,
  auroraColor3,
  auroraColor4,
  gridColor,
  gridSpacing
} = useSettings();

const dynamicStyles = computed(() => {
  return `
    :root {
      --bg-solid-color: ${solidColor.value};
      --bg-gradient-c1: ${gradientColor1.value};
      --bg-gradient-c2: ${gradientColor2.value};
      --bg-aurora-c1: ${auroraColor1.value};
      --bg-aurora-c2: ${auroraColor2.value};
      --bg-aurora-c3: ${auroraColor3.value};
      --bg-aurora-c4: ${auroraColor4.value};
      --bg-grid-color: ${gridColor.value};
      --bg-grid-spacing: ${gridSpacing.value}px;
    }
  `;
});

useHead({
  htmlAttrs: {
    "data-theme": themeMode,
    "data-base-bg": baseBgStyle,
  },
  style: [
    { children: dynamicStyles }
  ]
});

</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
