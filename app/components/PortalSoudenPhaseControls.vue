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
          <AppTabs
            v-model="selectedShubetsu"
            :options="shubetsuOptions"
            variant="pills"
          />
        </div>

        <!-- 盤名称セレクト & フィルター拡張/件数表示 -->
        <div class="phase-controls__row phase-controls__row--inline">
          <div class="phase-controls__select-group">
            <span class="phase-controls__label">盤名称:</span>
            <AppSelect
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
        <AppProgressBar
          :label="progressLabel || `フェーズ${phase} 進捗状況`"
          :completed="stats.completed"
          :total="stats.total"
          :excluded="stats.excluded"
          :pct="stats.pct"
          variant="success"
        />

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
