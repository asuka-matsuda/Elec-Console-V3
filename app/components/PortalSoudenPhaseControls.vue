<script setup lang="ts">
/**
 * SoudenPhaseControls
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
  <AtomsPanel>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-card-gap items-start">
      <div class="flex flex-col gap-3">
        <!-- 盤種別タブ -->
        <div class="flex items-center gap-3">
          <span class="phase-controls__label min-w-[50px]">盤種別:</span>
          <AtomsTabs
            v-model="selectedShubetsu"
            :options="shubetsuOptions"
          />
        </div>

        <!-- 盤名称セレクト & フィルター拡張/件数表示 -->
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-2">
            <span class="phase-controls__label min-w-[50px]">盤名称:</span>
            <AtomsSelect
              v-model="selectedBanMeisho"
              :options="banMeishoOptions"
              class="min-w-[160px]"
            />
          </div>

          <!-- 追加フィルター（Phase 2 基準値表示などのスロット） -->
          <slot name="filters-extra" />

          <AtomsBadge color="var(--theme-accent)">
            対象回路: {{ stats.allCount }} 件
          </AtomsBadge>
        </div>
      </div>

      <!-- 全体進捗バー & ミニマップ -->
      <div class="flex flex-col gap-3">
        <div class="flex flex-col w-full gap-1">
          <div class="phase-controls__stats-header flex items-center justify-between">
            <span class="font-medium text-[var(--color-text-main)]">
              {{ progressLabel || `フェーズ${phase} 進捗状況` }}
            </span>
            <div class="flex items-center gap-2 font-mono text-[var(--color-text-muted)]">
              <span><strong class="text-[var(--color-text-main)]">{{ stats.completed }}</strong> / {{ stats.total }}</span>
              <span class="text-[var(--color-text-main)]">({{ stats.pct }}%)</span>
              <AtomsBadge v-if="stats.excluded && stats.excluded > 0" color="var(--color-text-muted)">
                除外: {{ stats.excluded }}
              </AtomsBadge>
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
  </AtomsPanel>
</template>

<style scoped lang="scss">
.phase-controls {
  &__stats-header {
    font-size: var(--font-size-xs);
  }

  &__label {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-secondary);
  }
}
</style>
