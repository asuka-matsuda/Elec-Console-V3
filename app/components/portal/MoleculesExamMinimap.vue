<script setup lang="ts">
/**
 * MoleculesExamMinimap
 * 試験画面（Phase 1〜3）用の回路進捗ミニマップコンポーネント。
 * 回路全体の完了・除外・未着手状態をタイルグリッドで俯瞰表示し、回路選択操作を提供します。
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
  <AtomsPanel as="div" class="p-2.5">
    <div class="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
      <button
        v-for="item in tiles"
        :key="item.circuit.id"
        type="button"
        :class="[
          'minimap-tile w-2.5 h-2.5 p-0 hover:z-[2]',
          {
            'is-completed': item.isCompleted,
            'is-excluded': item.isExcluded,
          },
        ]"
        :title="`${item.circuit.banMeisho} / ${item.circuit.kairoBangou || ''} ${item.circuit.kairoMeisho || ''}${item.isCompleted ? ' (完了)' : item.isExcluded ? ' (除外)' : ' (未着手)'}`"
        @click="emit('selectCircuit', item.circuit)"
      />
    </div>
  </AtomsPanel>
</template>

<style scoped lang="scss">
.minimap-tile {
  cursor: pointer;

  border: 1px solid var(--color-tile-empty-border);
  border-radius: 2px;

  background-color: var(--color-tile-empty-bg);

  transition: var(--transition-interactive);

  &:hover {
    transform: scale(1.25);
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
</style>
