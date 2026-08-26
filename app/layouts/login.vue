<script setup lang="ts">
// ログインページ用の最小レイアウト
</script>

<template>
  <div class="l-login-layout">
    <AppPanel class="l-login-layout__panel">
      <AppSectionHeader
        v-if="$route.meta.title"
        :title="$route.meta.title as string"
      />
      <slot />
    </AppPanel>
  </div>
</template>

<style scoped lang="scss">
@use "~/assets/scss/foundation/mixins" as *;

.l-login-layout {
  @include flex-center(0);
  flex: 1;
}
</style>
