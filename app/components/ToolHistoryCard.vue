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
  <AtomsPanel
    as="article"
    class="history-item"
    :class="[`is-${entry.status}`]"
  >
    <header class="item-header">
      <div class="title-group">
        <span class="item-date">{{ entry.timestamp }}</span>
        <h3 class="item-title">
          <span>{{ entry.toolName }}</span>
          <AtomsBadge v-if="entry.mode === 'サイズ選定'" color="var(--color-category-tool)">
            {{ entry.mode }}
          </AtomsBadge>
          <AtomsBadge v-else-if="entry.mode === '電圧降下'" color="var(--theme-accent)">
            {{ entry.mode }}
          </AtomsBadge>
        </h3>
      </div>
    </header>

    <div class="item-body">
      <section class="item-section">
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
            <h4 class="section-title">計算結果</h4>
            <dl class="result-list">
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

      <section class="item-section">
        <h4 class="section-title">入力条件</h4>
        <dl class="result-list">
          <template v-for="(input, idx) in entry.inputs" :key="idx">
            <dt>{{ input.label }}</dt>
            <dd>{{ input.value }}</dd>
          </template>
        </dl>
      </section>
    </div>

    <footer class="item-footer">
      <AtomsButton
        variant="danger"
        size="sm"
        icon-only
        @click.prevent="handleDelete"
      >
        <AtomsIcon name="trash-2" size="sm" />
      </AtomsButton>
    </footer>
  </AtomsPanel>
</template>

<style scoped lang="scss">
.history-item {
  display: flex;
  flex-direction: column;
}

.item-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;

  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--color-border);
}

.title-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.item-date {
  font-size: var(--font-size-2xs);
  color: var(--color-text-muted);
}

.item-title {
  display: flex;
  align-items: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-main);
}

.item-body {
  display: flex;
  flex-direction: column;
}

.item-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.section-title {
  padding-left: var(--space-1);
  border-left: 2px solid var(--color-category-tool);
  color: var(--color-text-main);
}

.result-list {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-1) var(--space-3);

  font-size: var(--font-size-sm);
  color: var(--color-text-muted);

  dt {
    white-space: nowrap;
  }

  dd {
    color: var(--color-text-main);
    text-align: right;
  }
}

.item-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: auto;
}
</style>
