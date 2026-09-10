<script setup lang="ts">
/**
 * OrganismsHistoryCard
 * [Tool Organism] 計算履歴を1件表示するカードコンポーネント。
 * 入力条件と計算結果のプレビューを提供し、個別ツールのリッチな結果表示に対応します。
 */
import { computed } from 'vue'

import type { ConduitInputs } from '~/composables/tools/useConduitCalculator'
import type { HistoryEntry } from '~/types/history'
import type { VoltageCalcResult } from '~/types/voltage'
import type { ConduitCalcResult } from '~/utils/tools/conduit/conduitCalcLogic'
import type { RackCalcResult } from '~/utils/tools/rack/rackCalcLogic'
import type { RackInputs } from '~/utils/tools/rack/rackMapper'
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

const conduitInputs = computed(() => {
  return (props.entry.rawInputs ?? undefined) as unknown as ConduitInputs | undefined
})

const conduitResult = computed(() => {
  return (props.entry.rawResult ?? null) as unknown as ConduitCalcResult | null
})

const rackInputs = computed(() => {
  return (props.entry.rawInputs ?? null) as unknown as RackInputs | null
})

const rackResult = computed(() => {
  return (props.entry.rawResult ?? null) as unknown as RackCalcResult | null
})

const rackMaxDepth = computed(() => {
  if (props.entry.toolId !== 'rack' || !rackInputs.value) return 80
  const rH = rackInputs.value.rackHeight ?? 100

  return Math.max(1, rH - 20)
})

const rackMode = computed<'strong' | 'weak'>(() => {
  if (props.entry.toolId !== 'rack' || !rackInputs.value) return 'strong'

  return rackInputs.value.mode === 'weak' ? 'weak' : 'strong'
})

const weightResult = computed(() => {
  return (props.entry.rawResult ?? null) as unknown as WeightCalcResult | null
})
</script>

<template>
  <AtomsPanel
    as="article"
    class="history-card flex flex-col gap-3"
    :class="[`is-${entry.status}`]"
  >
    <!-- ヘッダー部: 日時、ツール名、モードバッジ -->
    <header class="flex items-end justify-between pb-2">
      <div class="flex flex-col gap-1 min-w-0">
        <span class="text-date font-medium">{{ entry.timestamp }}</span>
        <h3 class="flex items-center gap-2 text-sm font-bold text-title m-0">
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

    <!-- ボディ部: 計算結果プレビュー & 入力条件 -->
    <div class="flex flex-col gap-3 min-h-0">
      <!-- 1. 計算結果セクション -->
      <section class="flex flex-col gap-1 min-h-0">
        <div>
          <!-- 電圧降下・ケーブルサイズ選定 -->
          <ToolOrganismsVoltageResult
            v-if="entry.toolId === 'voltage' && voltageInputs && voltageResult"
            :inputs="voltageInputs"
            :result="voltageResult"
            size="sm"
          />

          <!-- 配管サイズ選定 -->
          <ToolOrganismsConduitResult
            v-else-if="entry.toolId === 'conduit' && conduitInputs && conduitResult"
            :inputs="conduitInputs"
            :result="conduitResult"
            size="sm"
          />

          <!-- ケーブルラック選定 -->
          <ToolOrganismsRackResult
            v-else-if="entry.toolId === 'rack' && rackInputs && rackResult"
            :result="rackResult"
            :max-depth="rackMaxDepth"
            :mode="rackMode"
          />

          <!-- ドラムサイズ・重量計算 -->
          <ToolOrganismsWeightResult
            v-else-if="entry.toolId === 'weight' && weightResult"
            :result="weightResult"
          />

          <!-- フォールバック: 汎用結果リスト -->
          <template v-else>
            <h4 class="section-title text-xs font-bold pl-1 m-0">
              計算結果
            </h4>
            <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm list-desc m-0">
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

      <!-- 2. 入力条件セクション -->
      <section class="flex flex-col gap-1 min-h-0">
        <h4 class="section-title text-xs font-bold pl-1 m-0">
          入力条件
        </h4>
        <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm list-desc m-0">
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

    <!-- フッター部: 削除ボタン -->
    <footer class="flex items-center justify-end mt-auto pt-2">
      <AtomsButton
        variant="danger"
        size="sm"
        icon-only
        aria-label="履歴を削除"
        @click.prevent="handleDelete"
      >
        <AtomsIcon name="trash-2" size="sm" />
      </AtomsButton>
    </footer>
  </AtomsPanel>
</template>

<style scoped lang="scss">
.history-card {
  header {
    border-bottom: 1px solid var(--color-border);
  }

  .text-date {
    font-size: var(--font-size-2xs);
    color: var(--color-text-muted);
  }

  .text-title {
    color: var(--color-text-main);
  }

  .section-title {
    border-left: 2px solid var(--color-category-tool);
    color: var(--color-text-main);
  }

  .list-desc {
    color: var(--color-text-muted);
  }

  .text-input-val {
    color: var(--color-text-main);
  }
}
</style>
