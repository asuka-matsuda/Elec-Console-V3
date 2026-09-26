<script setup lang="ts">
/**
 * Logo
 * [Atoms] アプリケーションのブランドロゴを表示し、クリック時にホームへ遷移するコンポーネント。
 * - 現場DX総合試験コンソールを象徴する gauge（計器・測定盤）アイコンを採用
 * - ヘッダー用途に特化した固定サイズ・リンク専用設計（アイコンサイズは文字に自動追従）
 */
</script>

<template>
  <NuxtLink
    to="/"
    class="flex shrink-0 items-center gap-item-gap logo"
  >
    <Icon name="gauge" class="logo-icon" />
    <span>Elec-Console</span>
  </NuxtLink>
</template>

<style scoped lang="scss">
.logo {
  cursor: pointer;
  user-select: none;

  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--color-text-main);
  white-space: nowrap;

  transition: var(--transition-fast);
}

.logo:active {
  transform: scale(0.98);
}

.logo-icon {
  color: var(--theme-accent);
  transition: var(--transition-fast);
}

.logo:hover .logo-icon {
  filter: brightness(1.25);
}
</style>
