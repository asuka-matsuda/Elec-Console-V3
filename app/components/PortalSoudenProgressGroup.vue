<script setup lang="ts">
/**
 * SoudenProgressGroup
 * 送電試験ダッシュボード内の系統別（幹線/二次側）進捗サマリーブロック。
 * 円形ゲージと各フェーズ（Phase 1〜3）のプログレスバーを表示します。
 */
defineProps<{
  label: string
  overallPct: number
  color: string
  total: number
  excluded: number
  p1Completed: number
  p1Pct: number
  p2Completed: number
  p2Pct: number
  p3Completed: number
  p3Pct: number
}>()
</script>

<template>
  <div class="souden-progress-group">
    <div class="souden-progress-group__gauge">
      <AtomsCircularGauge
        :value="overallPct"
        size="sm"
        :label="`${label} 全体`"
        :color="color"
      />
    </div>

    <div class="flex flex-col gap-3 souden-progress-group__bars">
      <!-- Phase 1 -->
      <div class="flex flex-col gap-1">
        <div class="flex items-center justify-between text-xs">
          <span class="font-medium text-[var(--color-text-main)]">回路確認 (Phase 1)</span>
          <div class="flex items-center gap-2 font-mono text-[var(--color-text-muted)]">
            <span><strong class="text-[var(--color-text-main)]">{{ p1Completed }}</strong> / {{ total }}</span>
            <span class="text-[var(--color-text-main)]">({{ p1Pct }}%)</span>
            <AtomsBadge v-if="excluded && excluded > 0" color="var(--color-text-muted)">
              除外: {{ excluded }}
            </AtomsBadge>
          </div>
        </div>
        <AtomsProgressBar :value="p1Completed" :max="total" color="var(--color-category-main)" />
      </div>

      <!-- Phase 2 -->
      <div class="flex flex-col gap-1">
        <div class="flex items-center justify-between text-xs">
          <span class="font-medium text-[var(--color-text-main)]">絶縁抵抗 (Phase 2)</span>
          <div class="flex items-center gap-2 font-mono text-[var(--color-text-muted)]">
            <span><strong class="text-[var(--color-text-main)]">{{ p2Completed }}</strong> / {{ total }}</span>
            <span class="text-[var(--color-text-main)]">({{ p2Pct }}%)</span>
            <AtomsBadge v-if="excluded && excluded > 0" color="var(--color-text-muted)">
              除外: {{ excluded }}
            </AtomsBadge>
          </div>
        </div>
        <AtomsProgressBar :value="p2Completed" :max="total" color="var(--color-category-tool)" />
      </div>

      <!-- Phase 3 -->
      <div class="flex flex-col gap-1">
        <div class="flex items-center justify-between text-xs">
          <span class="font-medium text-[var(--color-text-main)]">送電・電圧 (Phase 3)</span>
          <div class="flex items-center gap-2 font-mono text-[var(--color-text-muted)]">
            <span><strong class="text-[var(--color-text-main)]">{{ p3Completed }}</strong> / {{ total }}</span>
            <span class="text-[var(--color-text-main)]">({{ p3Pct }}%)</span>
            <AtomsBadge v-if="excluded && excluded > 0" color="var(--color-text-muted)">
              除外: {{ excluded }}
            </AtomsBadge>
          </div>
        </div>
        <AtomsProgressBar :value="p3Completed" :max="total" color="var(--color-status-success)" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.souden-progress-group {
  display: flex;
  gap: var(--space-6);
  align-items: center;

  @include mq("md") {
    flex-direction: column;
    gap: var(--space-3);
    align-items: flex-start;
  }

  &__gauge {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;

    width: 120px;
  }

  &__bars {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: var(--space-3);

    width: 100%;
  }
}
</style>
