<script setup lang="ts">
/**
 * MoleculesInputGroup
 * [Molecules] Input と Select や単位テキストアドオンを連結して表示するためのレイアウトコンポーネント。
 */
interface Props {
  addon?: string
}

defineProps<Props>()
</script>

<template>
  <div class="flex input-group">
    <!-- メイン入力欄 (Input 等) -->
    <div class="flex-1 min-w-0 input-group-main">
      <slot />
    </div>

    <!-- 単位テキストアドオン -->
    <span v-if="addon" class="inline-flex shrink-0 items-center justify-center addon">
      {{ addon }}
    </span>

    <!-- セレクトボックス等のカスタム連結 -->
    <div v-else-if="$slots.append" class="flex shrink-0 items-stretch append">
      <slot name="append" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.input-group {
  .addon {
    user-select: none;

    padding-block: 0.3em;
    padding-inline: 0.8em;
    border: var(--border-width-base) solid var(--color-border);
    border-left: none;

    font-size: inherit;
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
    white-space: nowrap;

    background-color: color-mix(in srgb, var(--surface-bg-elevated) 70%, var(--color-border) 30%);
  }

  .append {
    --select-width: auto;
    --select-min-width: 6.5em;
    --select-padding-inline: 0.8em;
    --select-border-left: none;
    --select-margin-left-active: calc(var(--border-width-base) * -1);
    --select-border-left-active: var(--border-width-base) solid var(--glow-color, var(--theme-accent));
  }
}
</style>
