<script setup lang="ts">
/**
 * AppSaveButton
 * 非同期の保存処理をトリガーし、ローディング状態や成功状態を視覚的にフィードバックするボタンコンポーネント。
 */
import { ref } from "vue";
import type { AppButtonProps } from "./AppButton.vue";

interface Props extends AppButtonProps {
  /** Promiseを返す保存関数 */
  saveFunction: () => Promise<void>;
  /** ボタンのラベル（通常時） */
  label?: string;
}

const props = defineProps<Props>();

const state = ref<"idle" | "saving" | "success">("idle");

const handleClick = async () => {
  if (props.disabled || state.value !== "idle") return;
  
  state.value = "saving";
  try {
    await props.saveFunction();
    state.value = "success";
    // 2秒後に元の状態に戻す
    setTimeout(() => {
      state.value = "idle";
    }, 2000);
  } catch (e) {
    console.error("Failed to save:", e);
    // エラー時はすぐに元に戻す
    state.value = "idle";
  }
};
</script>

<template>
  <AppButton
    v-bind="props"
    :disabled="disabled || state !== 'idle'"
    :size="size || 'sm'"
    :_variant="_variant || 'success'"
    class="c-save-button"
    :class="{ [`is-${state}`]: true }"
    @click="handleClick"
  >
    <!-- 通常時 -->
    <template v-if="state === 'idle'">
      <AppIcon name="save" size="sm" />
      {{ label || '履歴に保存' }}
    </template>
    
    <!-- 保存中 (ローディング) -->
    <template v-else-if="state === 'saving'">
      <AppIcon name="loader" size="sm" class="u-spin" />
      保存中...
    </template>
    
    <!-- 成功時 (チェックマーク) -->
    <template v-else-if="state === 'success'">
      <AppIcon name="check" size="sm" class="c-save-button__check" />
      保存しました
    </template>
  </AppButton>
</template>

<style scoped lang="scss">
.c-save-button {
  // --- Base Styles ---
  transition: all var(--transition-base);
  
  // --- Color Modifiers ---
  &.is-success {
    /* 成功時はボタン自体を少しグリーンにする */
    --btn-color: var(--color-status-success);

    pointer-events: none;
    border-color: var(--color-status-success);
    color: var(--color-status-success);
  }
}

.u-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.c-save-button__check {
  color: var(--color-status-success);
}
</style>
