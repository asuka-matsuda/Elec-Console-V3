<script setup lang="ts">
/**
 * PanelHistory
 * [Tool Organism] 計算履歴を1件表示するパネルコンポーネント。
 * 入力条件と計算結果のプレビューを提供し、個別ツールのリッチな結果表示に対応します。
 */
import { computed } from 'vue'

import type { HistoryEntry } from '~/types/history'
import type { VoltageCalcResult } from '~/types/voltage'
import type { ConduitCalcResult } from '~/utils/tools/conduit/conduitCalcLogic'
import type { RackCalcResult } from '~/utils/tools/rack/rackCalcLogic'
import type { VoltageFormState } from '~/utils/tools/voltage/voltageMapper'
import { mapFormToVoltageCalcInputs } from '~/utils/tools/voltage/voltageMapper'
import type { WeightCalcResult } from '~/utils/tools/weight/weightCalcLogic'

const props = defineProps<{
  entry: HistoryEntry
}>()

const emit = defineEmits<{
  delete: [id: string]
}>()

const handleDelete = () => {
  emit('delete', props.entry.id)
}

const voltageInputs = computed(() => {
  if (props.entry.toolId !== 'voltage' || !props.entry.rawInputs) return null
  try {
    return mapFormToVoltageCalcInputs(props.entry.rawInputs as unknown as VoltageFormState)
  }
  catch {
    return null
  }
})

const voltageResult = computed(() => {
  return (props.entry.rawResult ?? null) as unknown as VoltageCalcResult | null
})

const conduitResult = computed(() => {
  return (props.entry.rawResult ?? null) as unknown as ConduitCalcResult | null
})
const rackResult = computed(() => {
  return (props.entry.rawResult ?? null) as unknown as RackCalcResult | null
})

const weightResult = computed(() => {
  return (props.entry.rawResult ?? null) as unknown as WeightCalcResult | null
})
</script>

<template>
  <Panel
    as="article"
    class="history-panel flex flex-col gap-3"
    :class="[`is-${entry.status}`]"
  >

    <header class="flex items-end justify-between pb-2">
      <div class="flex flex-col gap-1 min-w-0">
        <span class="text-date">{{ entry.timestamp }}</span>
        <h3 class="flex items-center gap-2 text-title m-0">
          <span>{{ entry.toolName }}</span>
          <Badge v-if="entry.mode === 'サイズ選定'" id="tool:size-select">
            {{ entry.mode }}
          </Badge>
          <Badge v-else-if="entry.mode === '電圧降下'" id="tool:voltage-drop">
            {{ entry.mode }}
          </Badge>
        </h3>
      </div>
    </header>

    <div class="flex flex-col gap-3 min-h-0">

      <section class="flex flex-col gap-1 min-h-0">
        <div>

          <ToolResultVoltage
            v-if="entry.toolId === 'voltage' && voltageInputs && voltageResult"
            :inputs="voltageInputs"
            :result="voltageResult"
            size="sm"
          />

          <ToolResultConduit
            v-else-if="entry.toolId === 'conduit' && conduitResult"
            :result="conduitResult"
            size="sm"
          />

          <ToolResultRack
            v-else-if="entry.toolId === 'rack' && rackResult"
            :result="rackResult"
          />

          <ToolResultWeight
            v-else-if="entry.toolId === 'weight' && weightResult"
            :result="weightResult"
          />

          <template v-else>
            <h4 class="section-title pl-1 m-0">
              計算結果
            </h4>
            <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 list-desc m-0">
              <template v-for="(res, idx) in entry.results" :key="idx">
                <dt
                  class="whitespace-nowrap"
                  :style="{
                    color: res.color,
                    fontWeight: res.color ? 'bold' : 'normal',
                  }"
                >
                  {{ res.label }}
                </dt>
                <dd
                  class="text-right m-0"
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

      <section class="flex flex-col gap-1 min-h-0">
        <h4 class="section-title pl-1 m-0">
          入力条件
        </h4>
        <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 list-desc m-0">
          <template v-for="(input, idx) in entry.inputs" :key="idx">
            <dt class="whitespace-nowrap">
              {{ input.label }}
            </dt>
            <dd class="text-right text-input-val m-0">
              {{ input.value }}
            </dd>
          </template>
        </dl>
      </section>
    </div>

    <footer class="flex items-center justify-end mt-auto pt-2">
      <Button
        variant="danger"
        icon="trash-2"
        title="履歴を削除"
        @click.prevent="handleDelete"
      />
    </footer>
  </Panel>
</template>

<style scoped lang="scss">
.history-panel {
  header {
    border-bottom: 1px solid var(--color-border);
  }

  .text-date {
    font-size: var(--font-size-2xs);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
  }

  .text-title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
  }

  .section-title {
    border-left: 2px solid var(--color-category-tool);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
  }

  .list-desc {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }

  .text-input-val {
    color: var(--color-text-main);
  }
}
</style>
