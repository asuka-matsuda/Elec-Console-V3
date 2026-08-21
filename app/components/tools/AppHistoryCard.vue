<script setup lang="ts">
/**
 * AppHistoryCard
 * 計算履歴を1件表示するカードコンポーネントです。入力条件と計算結果のプレビューを提供します。
 */
import type { HistoryEntry } from "~/utils/calc/history/types";

const props = defineProps<{
  entry: HistoryEntry;
}>();

const emit = defineEmits<{
  (e: "delete", id: string): void;
}>();

const handleDelete = () => {
  emit("delete", props.entry.id);
};
</script>

<template>
  <AppCard variant="tool" class="c-history-card" :class="[`is-${entry.status}`]">
    <!-- ヘッダー -->
    <header class="c-history-card__header">
      <div class="c-history-card__title-group">
        <span class="c-history-card__date">{{ entry.timestamp }}</span>
        <h3 class="c-history-card__title">
          <span>{{ entry.toolName }}</span>
          <AppBadge v-if="entry.mode === 'サイズ選定'" variant="tool">{{ entry.mode }}</AppBadge>
          <AppBadge v-else-if="entry.mode === '電圧降下'" variant="primary">{{ entry.mode }}</AppBadge>
        </h3>
      </div>
    </header>

    <div class="c-history-card__body">
      <!-- 計算結果 (動的コンポーネントでDRY化) -->
      <section class="c-history-card__section">
        <div class="c-history-card__result-wrapper">
          <AppVoltageResult 
            v-if="entry.toolId === 'voltage' && entry.rawInputs && entry.rawResult"
            :inputs="entry.rawInputs"
            :result="entry.rawResult"
            size="sm"
          />
          <AppConduitResult
            v-else-if="entry.toolId === 'conduit' && entry.rawInputs && entry.rawResult"
            :inputs="entry.rawInputs"
            :result="entry.rawResult"
            size="sm"
          />
          <!-- 過去のデータなどrawデータがない場合のフォールバック -->
          <template v-else>
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
          </template>
        </div>
      </section>

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
  // --- Base Styles ---
  display: flex;
  flex-direction: column;
  gap: var(--gap-component);

  // --- State Modifiers ---
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
    align-items: flex-end;
    justify-content: space-between;

    padding-bottom: var(--gap-component);
    border-bottom: 1px solid var(--color-border);
  }

  &__title-group {
    display: flex;
    flex-direction: column;
    gap: var(--gap-element);
  }

  &__date {
    @extend %text-xs;

    color: var(--color-text-muted);
  }

  &__title {
    @extend %text-base;

    @include flex-start(var(--gap-element));

    font-weight: var(--font-weight-semibold);
    color: var(--color-text-main);
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: var(--gap-component);
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: var(--gap-element);
  }

  &__section-title {
    @extend %text-sm;

    padding-left: var(--gap-element);
    border-left: 2px solid var(--color-category-tool);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
  }

  &__list {

    @extend %text-sm;

    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--space-1) var(--space-3);

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
    align-items: center;
    justify-content: flex-end;
    margin-top: auto;
  }
}
</style>
