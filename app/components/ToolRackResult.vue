<script setup lang="ts">
/**
 * ToolRackResult
 * ケーブルラック選定ツールの計算・選定結果表示コンポーネントです。
 * 1段敷設（平置き・標準）と2段敷設（省スペース）の2段構えで比較表示します。
 */
import { computed } from 'vue'

import type { RackCalcResult } from '~/utils/tools/rack/rackCalcLogic'
import { formatRackResult } from '~/utils/tools/rack/rackResultPresenter'

const props = defineProps<{
  result: RackCalcResult | null
  maxDepth: number
  mode?: 'strong' | 'weak'
}>()

const vm = computed(() =>
  formatRackResult({
    result: props.result,
    maxDepth: props.maxDepth,
    mode: props.mode,
  }),
)
</script>

<template>
  <div class="rack-result">
    <!-- 1段敷設（平置き・標準） -->
    <MoleculesResultBox
      :status="vm.tier1.boxStatus"
      :is-empty="vm.isEmpty"
    >
      <template #title>
        <span class="box-title">
          {{ vm.tier1.title }}
          <AtomsBadge v-if="vm.tier1.badgeText" :color="vm.tier1.badgeColor">{{
            vm.tier1.badgeText
          }}</AtomsBadge>
        </span>
      </template>

      <template #value>
        <div class="value-box">
          <div class="value-text val">
            {{ vm.tier1.displaySize }}
          </div>
          <div
            v-if="!vm.isEmpty && vm.tier1.totalWidth !== '0'"
            class="sub-val"
          >
            必要幅: <strong>{{ vm.tier1.totalWidth }}</strong> mm / 最大高さ: <strong>{{ vm.tier1.maxHeight }}</strong> mm
          </div>
        </div>
      </template>
    </MoleculesResultBox>

    <!-- 2段敷設（省スペース） -->
    <MoleculesResultBox
      :status="vm.tier2.boxStatus"
      :is-empty="vm.isEmpty"
    >
      <template #title>
        <span class="box-title">
          {{ vm.tier2.title }}
          <AtomsBadge v-if="vm.tier2.badgeText" :color="vm.tier2.badgeColor">{{
            vm.tier2.badgeText
          }}</AtomsBadge>
        </span>
      </template>

      <template #value>
        <div class="value-box">
          <template v-if="vm.tier2.isApplicable">
            <div class="value-text val">
              {{ vm.tier2.displaySize }}
            </div>
            <div
              v-if="!vm.isEmpty && vm.tier2.totalWidth !== '0'"
              class="sub-val"
            >
              必要幅: <strong>{{ vm.tier2.totalWidth }}</strong> mm / 最大高さ: <strong>{{ vm.tier2.maxHeight }}</strong> mm
            </div>
          </template>
          <div v-else class="not-applicable">
            {{ vm.tier2.notApplicableText }}
          </div>
        </div>
      </template>
    </MoleculesResultBox>

    <!-- 詳細内訳 -->
    <ToolResultDetails>
      <ToolResultRow :label="mode === 'strong' ? '強電 必要幅 (1段)' : '強電 必要幅'">
        <strong>{{ vm.wStrong }}</strong> mm
      </ToolResultRow>
      <ToolResultRow :label="mode === 'weak' ? '弱電 必要幅 (1段)' : '弱電 必要幅'">
        <strong>{{ vm.wWeak }}</strong> mm
      </ToolResultRow>
      <ToolResultRow label="ラック有効高さ">
        <strong>{{ maxDepth }}</strong> mm
        <span class="depth-note">(親桁 H - 20mm)</span>
      </ToolResultRow>
    </ToolResultDetails>
  </div>
</template>

<style scoped lang="scss">
.rack-result {
  display: flex;
  flex-direction: column;
  gap: var(--space-card-gap);
}

.box-title {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  justify-content: center;
}

.value-box {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  align-items: center;
  justify-content: flex-start;

  width: 100%;
}

.val {
  font-family: var(--font-mono);
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  font-variant-numeric: tabular-nums;
}

.sub-val {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);

  strong {
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
  }
}

.not-applicable {
  padding: var(--space-1) 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.depth-note {
  font-size: var(--font-size-2xs);
  color: var(--color-text-muted);
}
</style>
