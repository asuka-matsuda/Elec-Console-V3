<script setup lang="ts">
/**
 * ToolInputPanel
 * ツール等の条件入力エリアを囲むパネルコンポーネントです。
 */
defineProps<{
  title?: string;
  icon?: string;
}>();

defineEmits(["reset"]);
</script>

<template>
  <AppPanel
    bracket-color="tool"
    class="c-tool-panel"
  >
    <template #header>
      <AppSectionHeader
        :title="title || '条件入力'"
        divider-type="fade-center"
        :icon="icon || 'edit'"
        variant="tool"
        size="md"
      >
        <template #actions>
          <AppButton
            variant="danger"
            size="sm"
            @click="$emit('reset')"
          >
            <AppIcon
              name="refresh-cw"
              size="sm"
            />
            リセット
          </AppButton>
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
