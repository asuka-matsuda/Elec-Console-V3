<script setup lang="ts">
import { watchEffect } from "vue";
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

if (import.meta.client) {
  watchEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode.value);
    document.documentElement.setAttribute('data-base-bg', baseBgStyle.value);
    
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty('--bg-solid-color', solidColor.value);
    rootStyle.setProperty('--bg-gradient-c1', gradientColor1.value);
    rootStyle.setProperty('--bg-gradient-c2', gradientColor2.value);
    rootStyle.setProperty('--bg-aurora-c1', auroraColor1.value);
    rootStyle.setProperty('--bg-aurora-c2', auroraColor2.value);
    rootStyle.setProperty('--bg-aurora-c3', auroraColor3.value);
    rootStyle.setProperty('--bg-aurora-c4', auroraColor4.value);
    rootStyle.setProperty('--bg-grid-color', gridColor.value);
    rootStyle.setProperty('--bg-grid-spacing', gridSpacing.value + 'px');
  });
}
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <AppDebugVisualizer />
</template>
