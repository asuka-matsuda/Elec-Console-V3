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
      <AppCircularGauge
        :value="overallPct"
        size="sm"
        :label="`${label} 全体`"
        :color="color"
      />
    </div>

    <div class="souden-progress-group__bars">
      <AppProgressBar
        label="回路確認 (Phase 1)"
        :completed="p1Completed"
        :total="total"
        :excluded="excluded"
        :pct="p1Pct"
        variant="main"
      />
      <AppProgressBar
        label="絶縁抵抗 (Phase 2)"
        :completed="p2Completed"
        :total="total"
        :excluded="excluded"
        :pct="p2Pct"
        variant="tool"
      />
      <AppProgressBar
        label="送電・電圧 (Phase 3)"
        :completed="p3Completed"
        :total="total"
        :excluded="excluded"
        :pct="p3Pct"
        variant="success"
      />
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
