<script setup lang="ts">
import type { HistoryEntry } from "~/utils/calc/history/types";

const props = defineProps<{
  entry: HistoryEntry;
}>();

const emit = defineEmits<{
  (e: "delete", id: string): void;
}>();

const handleDelete = () => {
  if (confirm("この履歴を削除しますか？")) {
    emit("delete", props.entry.id);
  }
};
</script>

<template>
  <AppCard variant="tool" class="c-history-card" :class="[`is-${entry.status}`]">
    <!-- ヘッダー -->
    <header class="c-history-card__header">
      <div class="c-history-card__title-group">
        <span class="c-history-card__date">{{ entry.timestamp }}</span>
        <h3 class="c-history-card__title">{{ entry.toolName }}</h3>
      </div>
      <div class="c-history-card__main-result">
        {{ entry.mainResultText }}
      </div>
    </header>

    <!-- ボディ（グリッドレイアウト） -->
    <div class="c-history-card__body">
      <!-- 入力条件 -->
      <section class="c-history-card__section">
        <h4 class="c-history-card__section-title">入力条件</h4>
        <dl class="c-history-card__list">
          <template v-for="(input, idx) in entry.inputs" :key="idx">
            <dt>{{ input.label }}</dt>
            <dd>{{ input.value }}</dd>
          </template>
        </dl>
      </section>

      <!-- 計算結果 -->
      <section class="c-history-card__section">
        <h4 class="c-history-card__section-title">計算結果</h4>
        <dl class="c-history-card__list">
          <template v-for="(res, idx) in entry.results" :key="idx">
            <dt :style="{ color: res.color, fontWeight: res.color ? 'bold' : 'normal' }">
              {{ res.label }}
            </dt>
            <dd :style="{ color: res.color, fontWeight: (res.isMain || res.color) ? 'bold' : 'normal' }">
              {{ res.value }}
            </dd>
          </template>
        </dl>
      </section>
    </div>

    <!-- フッター (削除アクション) -->
    <footer class="c-history-card__footer">
      <AppButtonDanger size="sm" icon-only @click.prevent="handleDelete">
        <AppIcon name="trash-2" size="sm" />
      </AppButtonDanger>
    </footer>
  </AppCard>
</template>

<style scoped lang="scss">
.c-history-card {
  display: flex;
  flex-direction: column;
  gap: var(--gap-component);

  /* Status Accents */
  &.is-error {
    border-color: var(--color-status-danger);
    box-shadow: inset 0 0 var(--blur-md) theme-color(var(--color-status-danger), 10%);
    
    .c-history-card__main-result {
      color: var(--color-status-danger);
      @include cyber-text-glow(50%, 8px, var(--color-status-danger));
    }
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    border-bottom: 1px solid var(--color-border);
    padding-bottom: var(--gap-component);
  }

  &__title-group {
    display: flex;
    flex-direction: column;
    gap: var(--gap-element);
  }

  &__date {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }

  &__title {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-main);
  }

  &__main-result {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-category-tool);
    text-align: right;
  }

  &__body {
    display: grid;
    gap: var(--gap-component);
    grid-template-columns: 1fr 1fr; // デスクトップファースト

    @include mq("md") {
      grid-template-columns: 1fr;
    }
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: var(--gap-element);
  }

  &__section-title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
    border-left: 2px solid var(--color-category-tool);
    padding-left: var(--gap-element);
  }

  &__list {
    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: var(--space-3);
    row-gap: var(--space-1);
    font-size: var(--font-size-sm);

    dt {
      color: var(--color-text-muted);
      white-space: nowrap;
    }
    
    dd {
      color: var(--color-text-main);
      text-align: right;
    }
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    margin-top: auto;
  }
}
</style>
