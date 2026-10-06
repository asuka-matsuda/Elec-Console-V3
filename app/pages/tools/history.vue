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
    <header class="flex items-center justify-between gap-y-inline-gap gap-x-item-gap">
      <h2 class="flex items-center gap-item-gap">
        <Icon name="clock" />
        <span>計算履歴</span>
      </h2>
      <div v-if="historyList.length > 0" class="flex items-center gap-item-gap">
        <Button variant="danger" size="sm" icon="trash-2" @click="handleClearAll">すべて削除する</Button>
      </div>
    </header>
    <hr class="divider">

    <nav class="radio-group">
      <button v-for="opt in tabs" :key="String(opt.value)" type="button" class="radio-group-item" :class="{ 'is-active': currentTab === opt.value }" @click="currentTab = opt.value">{{ opt.label }}</button>
    </nav>

    <ClientOnly>
      <ul v-if="historyList.length > 0" class="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-panel-gap">
        <li v-for="entry in historyList" :key="entry.id">
          <article class="panel history-panel flex flex-col gap-panel-gap h-full" :class="[`is-${entry.status}`]">
            <header class="flex items-end justify-between">
              <div class="flex flex-col gap-inline-gap min-w-0">
                <span class="text-date">{{ entry.timestamp }}</span>
                <h3 class="flex items-center gap-item-gap text-title">
                  <span>{{ entry.toolName }}</span>
                  <small v-if="entry.mode" class="tool-mode">({{ entry.mode }})</small>
                </h3>
              </div>
            </header>

            <section class="flex flex-col gap-inline-gap min-h-0">
              <ToolResultVoltage v-if="entry.toolId === 'voltage' && getVoltageInputs(entry) && getVoltageResult(entry)" :inputs="getVoltageInputs(entry)!" :result="getVoltageResult(entry)" size="sm" />

              <ToolResultConduit v-else-if="entry.toolId === 'conduit' && getConduitResult(entry)" :result="getConduitResult(entry)" size="sm" />

              <ToolResultRack v-else-if="entry.toolId === 'rack' && getRackResult(entry)" :result="getRackResult(entry)" />

              <ToolResultWeight v-else-if="entry.toolId === 'weight' && getWeightResult(entry)" :result="getWeightResult(entry)" />

              <template v-else>
                <h4 class="section-title">
                  計算結果
                </h4>
                <dl class="grid grid-cols-[auto_1fr] gap-x-panel-gap gap-y-inline-gap list-desc">
                  <template v-for="(res, idx) in entry.results" :key="idx">
                    <dt class="whitespace-nowrap" :style="{ color: res.color, fontWeight: res.color ? 'bold' : 'normal' }">
                      {{ res.label }}
                    </dt>
                    <dd class="text-right" :style="{ color: res.color, fontWeight: res.isMain || res.color ? 'bold' : 'normal' }">
                      {{ res.value }}
                    </dd>
                  </template>
                </dl>
              </template>
            </section>

            <section class="flex flex-col gap-inline-gap min-h-0">
              <h4 class="section-title">
                入力条件
              </h4>
              <dl class="grid grid-cols-[auto_1fr] gap-x-panel-gap gap-y-inline-gap list-desc">
                <template v-for="(input, idx) in entry.inputs" :key="idx">
                  <dt class="whitespace-nowrap">
                    {{ input.label }}
                  </dt>
                  <dd class="text-right text-input-val">
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
          <div v-for="skeletonIndex in 4" :key="`history-skeleton-${skeletonIndex}`" class="panel history-panel flex flex-col gap-panel-gap">
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

.tool-mode {
  font-size: var(--font-size-sm);
  font-weight: normal;
  color: var(--color-text-secondary);
}
</style>
