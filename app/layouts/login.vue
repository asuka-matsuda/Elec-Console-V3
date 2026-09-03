<script setup lang="ts">
import { computed } from 'vue'

import { useRoute } from '#app'

// ログインページ用の最小レイアウト
const route = useRoute()
const pageTitle = computed(() => route.meta.title as string | undefined)
</script>

<template>
  <div class="l-login-layout">
    <AppPanel class="l-login-layout__panel">
      <AppSectionHeader v-if="pageTitle" :title="pageTitle" />
      <slot />
    </AppPanel>
  </div>
</template>

<style scoped lang="scss">
.l-login-layout {
  @include flex-center-center;

  flex: 1;
  gap: 0;

  &__panel {
    min-width: 320px;
    max-width: 480px; // 一般的なログインパネルの最大幅
  }
}
</style>
