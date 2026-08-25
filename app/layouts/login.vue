<script setup lang="ts">
// ログインページ用の最小レイアウト
</script>

<template>
  <div class="l-login-layout">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.l-login-layout {
  @include flex-center(0);
  flex: 1;
}
</style>
