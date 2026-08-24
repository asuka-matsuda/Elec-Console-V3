<script setup lang="ts">
/**
 * AppToolResultPanel
 * ツールの計算結果や選定結果を表示し、保存アクション等を提供するパネルコンポーネントです。
 */
defineProps<{
  title?: string;
  icon?: string;
  saveDisabled?: boolean;
  saveFunction?: () => Promise<void>;
}>();
</script>

<template>
  <AppPanel bracket-color="tool" class="c-tool-panel">
    <template #header>
      <AppSectionHeader
        :title="title || '計算結果・選定結果'"
        divider-type="fade-center"
        :icon="icon || 'check-square'"
        variant="tool"
        size="md"
      >
        <template #actions>
          <AppSaveButton
            :disabled="saveDisabled"
            :save-function="saveFunction as () => Promise<void>"
          />
        </template>
      </AppSectionHeader>
    </template>

    <div class="c-tool-panel__content">
      <slot />
    </div>
  </AppPanel>
</template>

<style scoped lang="scss">
.c-tool-panel {
  // --- レイアウト・配置 ---
  flex: 1;

  // --- ボックスモデル ---
  min-height: 0;


  // --- 子要素 ---

  &__content {
    // --- レイアウト・配置 ---
    @include flex-column(var(--gap-section));
  }
}
</style>
