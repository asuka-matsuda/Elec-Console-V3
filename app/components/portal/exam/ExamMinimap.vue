<script setup lang="ts">
/**
 * ExamMinimap
 * [Portal Molecules] 試験画面用の回路進捗ミニマップ。完了・除外・未着手状態をタイル表示。
 */
import type { CircuitItem } from '#shared/types/circuit'
import { isPhaseComplete } from '#shared/utils/soudenExam'

const props = defineProps<{
  circuits: CircuitItem[]
  phase: number
}>()

const emit = defineEmits<{
  (e: 'selectCircuit', circuit: CircuitItem): void
}>()

const getTileClass = (c: CircuitItem): string =>
  c.isExcluded ? 'is-excluded' : isPhaseComplete(c, props.phase) ? 'is-completed' : ''
</script>

<template>
  <div class="minimap-container flex flex-wrap gap-1 py-2 px-1.5 max-h-24 overflow-y-auto overflow-x-hidden">
    <button
      v-for="c in circuits"
      :key="c.id"
      type="button"
      class="minimap-tile w-2.5 h-2.5 p-0 hover:z-[2]"
      :class="getTileClass(c)"
      @click="emit('selectCircuit', c)"
    />
  </div>
</template>

<style scoped>
.minimap-tile {
  cursor: pointer;
  border: 1px solid var(--color-tile-empty-border);
  background-color: var(--color-tile-empty-bg);
  transition: transform var(--transition-fast, 0.15s ease), border-color var(--transition-fast, 0.15s ease);
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
  opacity: 0.5;
  background-color: var(--color-tile-excluded-bg);
}
</style>
