<script setup lang="ts">
/**
 * 計算履歴一覧画面
 * 計算履歴ツールのコンポーネントです。過去に実行した各種計算ツールの履歴を一覧表示し、管理します。
 */
import { useCalculationHistoryPage } from '~/composables/tools/useCalculationHistoryPage'
import type { HistoryEntry } from '~/types/tools'
import type { VoltageCalcResult } from '~/types/voltage'
import type { ConduitCalcResult } from '~/utils/tools/conduit/conduitCalcLogic'
import type { RackCalcResult } from '~/utils/tools/rack/rackCalcLogic'
import type { VoltageFormState } from '~/utils/tools/voltage/voltageMapper'
import { mapFormToVoltageCalcInputs } from '~/utils/tools/voltage/voltageMapper'
import type { WeightCalcResult } from '~/utils/tools/weight/weightCalcLogic'

useHead({
  title: '計算履歴',
})

const {
  tabs,
  currentTab,
  historyList,
  isLoading,
  handleClearAll,
  openDeleteModal,
} = useCalculationHistoryPage()

const getVoltageInputs = (entry: HistoryEntry) => {
  if (entry.toolId !== 'voltage' || !entry.rawInputs) return null
  try {
    return mapFormToVoltageCalcInputs(entry.rawInputs as unknown as VoltageFormState)
  }
  catch {
    return null
  }
}

const getVoltageResult = (entry: HistoryEntry) => (entry.rawResult ?? null) as unknown as VoltageCalcResult | null
const getConduitResult = (entry: HistoryEntry) => (entry.rawResult ?? null) as unknown as ConduitCalcResult | null
const getRackResult = (entry: HistoryEntry) => (entry.rawResult ?? null) as unknown as RackCalcResult | null
const getWeightResult = (entry: HistoryEntry) => (entry.rawResult ?? null) as unknown as WeightCalcResult | null
</script>

<template>
  <div class="flex flex-col gap-panel-gap">
    <div class="flex items-center justify-between gap-y-inline-gap gap-x-item-gap flex-wrap">
      <Tabs v-model="currentTab" :items="tabs" class="flex-1 min-w-0" />
      <div v-if="!isLoading && historyList.length > 0" class="flex items-center gap-item-gap shrink-0">
        <Button variant="danger" size="sm" icon="trash-2" @click="handleClearAll">すべて削除する</Button>
      </div>
    </div>

    <ClientOnly>
      <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-panel-gap">
        <div v-for="skeletonIndex in 4" :key="`history-skeleton-${skeletonIndex}`" class="panel flex flex-col gap-panel-gap">
          <div class="flex flex-col gap-inline-gap">
            <Skeleton width="6rem" height="0.85rem" />
            <Skeleton width="10rem" height="1.4rem" />
          </div>
          <div class="flex flex-col gap-inline-gap">
            <Skeleton width="100%" height="4rem" />
          </div>
          <div class="flex flex-col gap-inline-gap">
            <Skeleton width="100%" height="3rem" />
          </div>
        </div>
      </div>

      <ul v-else-if="historyList.length > 0" class="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-panel-gap">
        <li v-for="entry in historyList" :key="entry.id">
          <article class="panel flex flex-col gap-panel-gap h-full" :class="[`is-${entry.status}`]">
            <header class="flex flex-col gap-inline-gap min-w-0">
              <time>{{ entry.timestamp }}</time>
              <h4 class="flex items-center gap-item-gap">
                <span>{{ entry.toolName }}</span>
                <small v-if="entry.mode">({{ entry.mode }})</small>
              </h4>
            </header>
            <hr class="divider">

            <section class="flex flex-col gap-inline-gap min-h-0">
              <ToolResultVoltage v-if="entry.toolId === 'voltage' && getVoltageInputs(entry) && getVoltageResult(entry)" :inputs="getVoltageInputs(entry)!" :result="getVoltageResult(entry)" size="sm" />

              <ToolResultConduit v-else-if="entry.toolId === 'conduit' && getConduitResult(entry)" :result="getConduitResult(entry)" size="sm" />

              <ToolResultRack v-else-if="entry.toolId === 'rack' && getRackResult(entry)" :result="getRackResult(entry)" />

              <ToolResultWeight v-else-if="entry.toolId === 'weight' && getWeightResult(entry)" :result="getWeightResult(entry)" />

              <template v-else>
                <span class="label">計算結果</span>
                <dl class="grid grid-cols-[auto_1fr] gap-x-panel-gap gap-y-inline-gap">
                  <template v-for="(res, idx) in entry.results" :key="idx">
                    <dt class="whitespace-nowrap">
                      <small>{{ res.label }}</small>
                    </dt>
                    <dd class="text-right tabular-nums">
                      <strong v-if="res.isMain || res.color">{{ res.value }}</strong>
                      <span v-else>{{ res.value }}</span>
                    </dd>
                  </template>
                </dl>
              </template>
            </section>

            <section class="flex flex-col gap-inline-gap min-h-0">
              <span class="label">入力条件</span>
              <dl class="grid grid-cols-[auto_1fr] gap-x-panel-gap gap-y-inline-gap">
                <template v-for="(input, idx) in entry.inputs" :key="idx">
                  <dt class="whitespace-nowrap">
                    <small>{{ input.label }}</small>
                  </dt>
                  <dd class="text-right tabular-nums">
                    {{ input.value }}
                  </dd>
                </template>
              </dl>
            </section>

            <footer class="flex items-center justify-end mt-auto">
              <Tooltip text="履歴を削除">
                <Button variant="danger" size="sm" icon="trash-2" @click.prevent="openDeleteModal(entry.id)" />
              </Tooltip>
            </footer>
          </article>
        </li>
      </ul>

      <EmptyState v-else icon="inbox" title="保存された履歴はありません" description="計算ツールで計算を実行し、「履歴に保存」を行うとここに記録されます。" />

      <template #fallback>
        <div class="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-panel-gap">
          <div v-for="skeletonIndex in 4" :key="`history-skeleton-${skeletonIndex}`" class="panel flex flex-col gap-panel-gap">
            <div class="flex flex-col gap-inline-gap">
              <Skeleton width="6rem" height="0.85rem" />
              <Skeleton width="10rem" height="1.4rem" />
            </div>
            <div class="flex flex-col gap-inline-gap">
              <Skeleton width="100%" height="4rem" />
            </div>
            <div class="flex flex-col gap-inline-gap">
              <Skeleton width="100%" height="3rem" />
            </div>
          </div>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
