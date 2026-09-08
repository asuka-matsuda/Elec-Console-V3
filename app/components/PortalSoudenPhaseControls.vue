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
  <AppPanel variant="hud">
    <div class="phase-controls">
      <div class="phase-controls__filters">
        <!-- 盤種別タブ -->
        <div class="phase-controls__row">
          <span class="phase-controls__label">盤種別:</span>
          <AtomsTabs
            v-model="selectedShubetsu"
            :options="shubetsuOptions"
            variant="pills"
          />
        </div>

        <!-- 盤名称セレクト & フィルター拡張/件数表示 -->
        <div class="phase-controls__row phase-controls__row--inline">
          <div class="phase-controls__select-group">
            <span class="phase-controls__label">盤名称:</span>
            <AtomsSelect
              v-model="selectedBanMeisho"
              :options="banMeishoOptions"
              class="phase-controls__select"
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
      <div class="phase-controls__progress">
        <div class="flex flex-col w-full gap-1">
          <div class="flex items-center justify-between text-xs">
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
          <AtomsProgressBar :value="stats.completed" :max="stats.total" color="var(--color-status-success)" />
        </div>

        <!-- ミニマップ -->
        <PortalExamMinimap
          :circuits="circuits"
          :phase="phase"
          @select-circuit="emit('select-circuit', $event)"
        />
      </div>
    </div>
  </AppPanel>
</template>

<style scoped lang="scss">
.phase-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-card-gap);
  align-items: flex-start;

  @include mq("lg") {
    grid-template-columns: 1fr;
  }

  &__filters {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  &__row {
    display: flex;
    gap: var(--space-3);
    align-items: center;

    &--inline {
      flex-wrap: wrap;
    }
  }

  &__label {
    min-width: 50px;
    font-size: var(--text-xs);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-secondary);
  }

  &__select-group {
    display: flex;
    gap: var(--space-2);
    align-items: center;
  }

  &__select {
    min-width: 160px;
  }

  &__progress {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
}
</style>
