<script setup lang="ts">
/**
 * PortalOrganismsSoudenPhaseControls
 * 送電試験（フェーズ1〜3）共通のコントロールパネルコンポーネント。
 * 盤種別タブ、盤名称セレクト、件数表示バッジ、全体進捗バー、ミニマップを一元管理します。
 */
import type { CircuitItem } from '~/types/souden'

const selectedShubetsu = defineModel<string>('shubetsu', { default: 'ALL' })
const selectedBanMeisho = defineModel<string>('banMeisho', { default: 'ALL' })

defineProps<{
  shubetsuOptions: { label: string, value: string }[]
  banMeishoOptions: { label: string, value: string }[]
  stats: {
    allCount: number
    completed: number
    total: number
    excluded: number
    pct: number
  }
  circuits: CircuitItem[]
  phase: 1 | 2 | 3
  progressLabel?: string
}>()

const emit = defineEmits<{
  (e: 'select-circuit', circuit: CircuitItem): void
}>()
</script>

<template>
  <Panel>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-panel-gap items-start">
      <div class="flex flex-col gap-3">
        <!-- 盤種別タブ -->
        <div class="flex items-center gap-3">
          <span class="controls-label min-w-[50px]">盤種別:</span>
          <AtomsTabs
            v-model="selectedShubetsu"
            :options="shubetsuOptions"
          />
        </div>

        <!-- 盤名称セレクト & フィルター拡張/件数表示 -->
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-2">
            <span class="controls-label min-w-[50px]">盤名称:</span>
            <Select
              v-model="selectedBanMeisho"
              :options="banMeishoOptions"
              class="min-w-[160px]"
            />
          </div>

          <!-- 追加フィルター（Phase 2 基準値表示などのスロット） -->
          <slot name="filters-extra" />

          <span class="phase-target-count">
            対象回路: <strong class="phase-target-count__num">{{ stats.allCount }}</strong> 件
          </span>
        </div>
      </div>

      <!-- 全体進捗バー & ミニマップ -->
      <div class="flex flex-col gap-3">
        <div class="flex flex-col w-full gap-1">
          <div class="stats-header flex items-center justify-between">
            <span class="stats-title">
              {{ progressLabel || `フェーズ${phase} 進捗状況` }}
            </span>
            <div class="stats-numbers flex items-center gap-2">
              <span><strong>{{ stats.completed }}</strong> / {{ stats.total }}</span>
              <span>({{ stats.pct }}%)</span>
              <Badge v-if="stats.excluded && stats.excluded > 0" id="exam:excluded">
                除外: {{ stats.excluded }}
              </Badge>
            </div>
          </div>
          <PortalAtomsProgressBar :value="stats.completed" :max="stats.total" color="var(--color-status-success)" />
        </div>

        <!-- ミニマップ -->
        <PortalMoleculesExamMinimap
          :circuits="circuits"
          :phase="phase"
          @select-circuit="emit('select-circuit', $event)"
        />
      </div>
    </div>
  </Panel>
</template>

<style scoped lang="scss">
.stats-header {
  font-size: var(--font-size-xs);
}

.stats-title {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-main);
}

.stats-numbers {
  font-family: var(--font-mono);
  color: var(--color-text-muted);

  strong {
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
  }

  span {
    color: var(--color-text-main);
  }
}

.controls-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-secondary);
}

.phase-target-count {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  white-space: nowrap;

  &__num {
    font-family: var(--font-mono);
    font-weight: var(--font-weight-bold);
    color: var(--theme-accent);
  }
}
</style>
