<script setup lang="ts">
/**
 * ExamMinimap
 * [Portal Molecules] 試験画面用の回路進捗ミニマップ。完了・除外・未着手状態をタイル表示。
 */
import type { CircuitItem } from '#shared/types/circuit'
import { isPhaseComplete } from '#shared/utils/soudenExam'

const props = withDefaults(
  defineProps<{
    circuits: CircuitItem[]
    phase: number
    loading?: boolean
  }>(),
  {
    loading: false,
  },
)

const emit = defineEmits<{
  (e: 'selectCircuit', circuit: CircuitItem): void
}>()

const getTileClass = (c: CircuitItem): string =>
  c.isExcluded ? 'is-excluded' : isPhaseComplete(c, props.phase) ? 'is-completed' : ''
</script>

<template>
  <div class="minimap-container flex flex-wrap gap-inline-gap max-h-24 overflow-y-auto overflow-x-hidden">
    <template v-if="loading">
      <Skeleton v-for="i in 32" :key="`minimap-skeleton-${i}`" width="10px" height="10px" />
    </template>
    <template v-else-if="circuits && circuits.length > 0">
      <button v-for="c in circuits" :key="c.id" type="button" class="minimap-tile w-2.5 h-2.5 hover:z-[2]" :class="getTileClass(c)" :title="`${c.kairoMeisho || c.id}${c.isExcluded ? ' (除外)' : ''}`" @click="emit('selectCircuit', c)" />
    </template>
  </div>
</template>

<style scoped lang="scss">
.minimap-container {
  min-height: 26px;
}

.minimap-tile {
  padding: 0;
  border: 1px solid var(--color-tile-empty-border);
  background-color: var(--color-tile-empty-bg);
  transition: transform var(--transition-fast, 0.15s ease), border-color var(--transition-fast, 0.15s ease);

  @include state-interactive;
}

.minimap-tile:hover {
  transform: scale(1.25);
  border-color: var(--color-tile-hover-border);
}

.minimap-tile.is-completed {
  border-color: var(--color-status-success);
  background-color: var(--color-status-success);
}

.minimap-tile.is-excluded {
  border-color: var(--color-tile-excluded-border);
  background-color: var(--color-tile-excluded-bg);
  background-image: linear-gradient(
    45deg,
    transparent calc(50% - 0.75px),
    var(--color-text-muted) calc(50% - 0.75px),
    var(--color-text-muted) calc(50% + 0.75px),
    transparent calc(50% + 0.75px)
  );
}
</style>
