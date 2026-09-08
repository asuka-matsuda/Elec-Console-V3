<script setup lang="ts">
/**
 * ExamMinimap
 * 試験画面（Phase 1〜3）用の回路進捗ミニマップ
 */
import { computed } from 'vue'

import type { CircuitItem } from '~/types/souden'

const props = defineProps<{
  circuits: CircuitItem[]
  phase: number
}>()

const emit = defineEmits<{
  (e: 'selectCircuit', circuit: CircuitItem): void
}>()

function isCompleted(c: CircuitItem): boolean {
  if (props.phase === 1) {
    return Boolean(c.p1ConfirmedAt && c.p1Kakunin && c.p1Mashishime)
  }
  if (props.phase === 2) {
    return Boolean(c.p2ConfirmedAt && c.p2IsComplete)
  }
  if (props.phase === 3) {
    return Boolean(c.p3ConfirmedAt)
  }

  return false
}

const tiles = computed(() => {
  return props.circuits.map(c => ({
    circuit: c,
    isCompleted: isCompleted(c),
    isExcluded: Boolean(c.isExcluded),
  }))
})
</script>

<template>
  <div class="minimap">
    <div class="minimap__grid">
      <button
        v-for="item in tiles"
        :key="item.circuit.id"
        type="button"
        :class="[
          'minimap__tile',
          {
            'is-completed': item.isCompleted,
            'is-excluded': item.isExcluded,
          },
        ]"
        :title="`${item.circuit.banMeisho} / ${item.circuit.kairoBangou || ''} ${item.circuit.kairoMeisho || ''}${item.isCompleted ? ' (完了)' : item.isExcluded ? ' (除外)' : ' (未着手)'}`"
        @click="emit('selectCircuit', item.circuit)"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.minimap {
  display: flex;
  flex-direction: column;
  gap: var(--space-2, 8px);

  padding: var(--space-3, 12px);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md, 8px);

  background-color: var(--surface-bg-solid);

  &__grid {
    overflow-y: auto;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;

    max-height: 80px;
  }

  &__tile {
    cursor: pointer;

    width: 10px;
    height: 10px;
    padding: 0;
    border: 1px solid var(--color-tile-empty-border);
    border-radius: 2px;

    background-color: var(--color-tile-empty-bg);

    transition: var(--transition-fast);

    &:hover {
      z-index: 2;
      transform: scale(1.4);
      border-color: var(--color-tile-hover-border);
    }

    &.is-completed {
      --glow-color: var(--color-status-success);

      border-color: var(--color-status-success);
      background-color: var(--color-status-success);
      box-shadow: var(--shadow-glow-sm);
    }

    &.is-excluded {
      border-color: var(--color-tile-excluded-border);
      opacity: 0.5;
      background-color: var(--color-tile-excluded-bg);
    }
  }
}
</style>
