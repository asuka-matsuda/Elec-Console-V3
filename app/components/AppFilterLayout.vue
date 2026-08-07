<script setup lang="ts">
/**
 * AppDbLayout
 * 
 * データベースやリファレンス画面で使用する、
 * 左サイドバー（検索・絞り込み）と右メインコンテンツのレイアウトを提供します。
 */
</script>

<template>
  <div class="l-filter-layout">
    <div class="l-filter-layout__grid">
      <!-- Sidebar -->
      <aside class="l-filter-layout__sidebar">
        <slot name="sidebar" />
      </aside>

      <!-- Main Content -->
      <main class="l-filter-layout__main">
        <slot name="main" />
      </main>
    </div>
  </div>
</template>
