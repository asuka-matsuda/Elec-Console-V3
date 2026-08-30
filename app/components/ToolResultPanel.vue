<script setup lang="ts">
import { computed } from "vue";
/**
 * ToolResultPanel
 * ツールの計算結果や選定結果を表示し、保存アクション等を提供するパネルコンポーネントです。
 */
const props = defineProps<{
  title?: string;
  icon?: string;
  saveDisabled?: boolean;
  saveFunction?: () => Promise<void>;
}>();
const typedSaveFunction = computed(() => props.saveFunction as (() => Promise<void>));
</script>

<template>
  <AppPanel
    bracket-color="tool"
    class="c-tool-panel"
  >
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
            :save-function="typedSaveFunction"
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
    @include flex-column(var(--space-card-gap));
  }
}
</style>
