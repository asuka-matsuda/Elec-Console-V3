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

  background-color: rgb(255 255 255 / 2%);

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
    border: 1px solid rgb(255 255 255 / 15%);
    border-radius: 2px;

    background-color: rgb(255 255 255 / 10%);

    transition: transform var(--duration-fast) var(--ease-base), background-color var(--duration-fast) var(--ease-base), border-color var(--duration-fast) var(--ease-base);

    &:hover {
      z-index: 2;
      transform: scale(1.4);
      border-color: #fff;
    }

    &.is-completed {
      --glow-color: var(--color-status-success);

      border-color: var(--color-status-success);
      background-color: var(--color-status-success);
      box-shadow: var(--shadow-glow-sm);
    }

    &.is-excluded {
      border-color: rgb(148 163 184 / 30%);
      opacity: 0.5;
      background-color: rgb(148 163 184 / 20%);
    }
  }
}
</style>
