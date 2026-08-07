<script setup lang="ts">
/**
 * AppDbLayout
 * 
 * データベースやリファレンス画面で使用する、
 * 左サイドバー（検索・絞り込み）と右メインコンテンツのレイアウトを提供します。
 */
</script>

<template>
  <div class="l-sidebar-layout">
    <div class="l-sidebar-layout__grid">
      <!-- Sidebar -->
      <aside class="l-sidebar-layout__sidebar">
        <slot name="sidebar" />
      </aside>

      <!-- Main Content -->
      <main class="l-sidebar-layout__main">
        <slot name="main" />
      </main>
    </div>
  </div>
</template>
