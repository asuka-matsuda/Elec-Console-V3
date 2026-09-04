<script setup lang="ts">
/**
 * ToolHistoryCard
 * 計算履歴を1件表示するカードコンポーネントです。入力条件と計算結果のプレビューを提供します。
 */
import type { HistoryEntry } from '~/types/history'

const props = defineProps<{
  entry: HistoryEntry
}>()

const emit = defineEmits<{
  (e: 'delete', id: string): void
}>()

const handleDelete = () => {
  emit('delete', props.entry.id)
}
const getInputs = (entry: HistoryEntry) => entry.rawInputs as never
const getResult = (entry: HistoryEntry) => entry.rawResult as never
</script>

<template>
  <AppCard
    variant="tool"
    class="c-history-card"
    :class="[`is-${entry.status}`]"
  >
    <header class="c-history-card__header">
      <div class="c-history-card__title-group">
        <span class="c-history-card__date">{{ entry.timestamp }}</span>
        <h3 class="c-history-card__title">
          <span>{{ entry.toolName }}</span>
          <AppBadge v-if="entry.mode === 'サイズ選定'" color="tool">
            {{ entry.mode }}
          </AppBadge>
          <AppBadge v-else-if="entry.mode === '電圧降下'" color="primary">
            {{ entry.mode }}
          </AppBadge>
        </h3>
      </div>
    </header>

    <div class="c-history-card__body">
      <section class="c-history-card__section">
        <div>
          <ToolVoltageResult
            v-if="
              entry.toolId === 'voltage' && entry.rawInputs && entry.rawResult
            "
            :inputs="getInputs(entry)"
            :result="getResult(entry)"
            size="sm"
          />
          <ToolConduitResult
            v-else-if="
              entry.toolId === 'conduit' && entry.rawInputs && entry.rawResult
            "
            :inputs="getInputs(entry)"
            :result="getResult(entry)"
            size="sm"
          />
          <template v-else>
            <h4 class="c-history-card__section-title">計算結果</h4>
            <dl class="c-history-card__list">
              <template v-for="(res, idx) in entry.results" :key="idx">
                <dt
                  :style="{
                    color: res.color,
                    fontWeight: res.color ? 'bold' : 'normal',
                  }"
                >
                  {{ res.label }}
                </dt>
                <dd
                  :style="{
                    color: res.color,
                    fontWeight: res.isMain || res.color ? 'bold' : 'normal',
                  }"
                >
                  {{ res.value }}
                </dd>
              </template>
            </dl>
          </template>
        </div>
      </section>

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

    <footer class="c-history-card__footer">
      <AppButton
        variant="danger"
        size="sm"
        icon-only
        @click.prevent="handleDelete"
      >
        <AppIcon name="trash-2" size="sm" />
      </AppButton>
    </footer>
  </AppCard>
</template>

<style scoped lang="scss">
.c-history-card {
  @include flex-start-stretch($direction: column);

  &__header {
    @include flex-between-center;

    gap: 0;
    align-items: flex-end;
    padding-bottom: var(--space-2);
    border-bottom: 1px solid var(--color-border);
  }

  &__title-group {
    @include flex-start-stretch($direction: column);

    gap: var(--space-1);
  }

  &__date {
    @include text-meta;
  }

  &__title {
    @include text-title("sm");
    @include flex-start-center;

    color: var(--color-text-main);
  }

  &__body {
    @include flex-start-stretch($direction: column);
  }

  &__section {
    @include flex-start-stretch($direction: column);

    gap: var(--space-1);
  }

  &__section-title {
    @include text-title("sm");

    padding-left: var(--space-1);
    border-left: 2px solid var(--color-category-tool);
    color: var(--color-text-main);
  }

  &__list {
    @include text-desc;
    @include grid(auto 1fr, var(--space-1) var(--space-3));

    dt {
      white-space: nowrap;
    }

    dd {
      color: var(--color-text-main);
      text-align: right;
    }
  }

  &__footer {
    @include flex-end-center;

    margin-top: auto;
  }
}
</style>
