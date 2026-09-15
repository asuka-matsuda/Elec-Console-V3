<script setup lang="ts">
/**
 * MoleculesSoudenProgressBarGroup
 * [Portal Molecules] 送電試験の各フェーズ（Phase 1〜3）プログレスバー群コンポーネント。
 * タイトル、試験入力ボタン、完了件数/割合、除外バッジ、およびAtomsProgressBarを描画します。
 */
import { computed } from 'vue'

const props = defineProps<{
  total: number
  excluded: number
  p1Completed: number
  p1Pct: number
  p2Completed: number
  p2Pct: number
  p3Completed: number
  p3Pct: number
  siteId?: string
  keiTo?: '幹線' | '二次側'
}>()

interface PhaseItem {
  phase: number
  title: string
  completed: number
  pct: number
  color: string
}

const phases = computed<PhaseItem[]>(() => [
  {
    phase: 1,
    title: '回路確認 (Phase 1)',
    completed: props.p1Completed,
    pct: props.p1Pct,
    color: 'var(--color-category-main)',
  },
  {
    phase: 2,
    title: '絶縁抵抗 (Phase 2)',
    completed: props.p2Completed,
    pct: props.p2Pct,
    color: 'var(--color-category-tool)',
  },
  {
    phase: 3,
    title: '送電・電圧 (Phase 3)',
    completed: props.p3Completed,
    pct: props.p3Pct,
    color: 'var(--color-status-success)',
  },
])
</script>

<template>
  <div class="souden-progress-bar-group flex flex-1 flex-col gap-3 w-full">
    <div
      v-for="item in phases"
      :key="item.phase"
      class="flex flex-col gap-1"
    >
      <div class="progress-row-header flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="phase-title">{{ item.title }}</span>
          <AtomsButton
            v-if="siteId && keiTo"
            :to="`/portal/${siteId}/phase${item.phase}?kei_to=${keiTo}`"
            variant="secondary"
          >
            試験入力
          </AtomsButton>
        </div>
        <div class="phase-stat flex items-center gap-2">
          <span><strong>{{ item.completed }}</strong> / {{ total }}</span>
          <span class="stat-pct">({{ item.pct }}%)</span>
          <AtomsBadge v-if="excluded && excluded > 0" color="var(--color-text-muted)">
            除外: {{ excluded }}
          </AtomsBadge>
        </div>
      </div>
      <PortalAtomsProgressBar :value="item.completed" :max="total" :color="item.color" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.souden-progress-bar-group {
  color: var(--color-text-main);

  .progress-row-header {
    font-size: var(--font-size-xs);
  }

  .phase-title {
    font-weight: var(--font-weight-medium, 500);
    color: var(--color-text-main);
  }

  .phase-stat {
    font-family: var(--font-mono);
    color: var(--color-text-muted);

    strong,
    .stat-pct {
      color: var(--color-text-main);
    }
  }
}
</style>
