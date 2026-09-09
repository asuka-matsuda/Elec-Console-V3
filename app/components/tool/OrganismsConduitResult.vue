<script setup lang="ts">
/**
 * OrganismsConduitResult
 * [Tool Organism] 配管サイズ計算の結果を視覚的に表示する3段縦積みコンポーネント。
 * 内線規程勧告（32%, 48%）およびユーザー指定占積率の結果を表示し、
 * フッターに内線規程の勧告根拠を表示します。
 */
import { computed } from 'vue'

import type { ConduitInputs } from '~/composables/tools/useConduitCalculator'
import { CONDUIT_UI_LABELS } from '~/constants/conduitConstants'
import type { ConduitCalcResult } from '~/utils/tools/conduit/conduitCalcLogic'
import { formatConduitResult } from '~/utils/tools/conduit/conduitResultPresenter'

const props = defineProps<{
  result: ConduitCalcResult | null
  inputs?: ConduitInputs
  size?: 'sm' | 'md'
}>()

const vm = computed(() => formatConduitResult(props.result))

const status32 = computed(() =>
  vm.value.status32Class.replace('is-', '') as 'neutral' | 'success' | 'danger',
)
const status48 = computed(() =>
  vm.value.status48Class.replace('is-', '') as 'neutral' | 'success' | 'danger',
)
const statusCustom = computed(() =>
  vm.value.statusCustomClass.replace('is-', '') as 'neutral' | 'success' | 'danger',
)
</script>

<template>
  <div
    class="flex flex-1 flex-col min-h-0 items-stretch"
    :class="[size === 'sm' ? 'gap-3 is-sm' : 'gap-[var(--space-panel-gap)]']"
  >
    <!-- Row 1: 32% (異種) -->
    <MoleculesResultBox
      :status="status32"
      :size="size"
    >
      <template #title>
        <span class="flex items-center justify-center gap-2">
          {{ CONDUIT_UI_LABELS.TITLE_32 }}
          <AtomsBadge v-if="vm.isDiffSize" color="var(--color-status-success)">規程推奨</AtomsBadge>
        </span>
      </template>
      <template #value>
        <span>{{ vm.size32 }}</span>
        <template v-if="vm.isReady && !vm.isOversize32">
          <small class="sep">(</small>
          <span class="sub-val">{{ vm.fill32 }}</span>
          <small class="unit">{{ CONDUIT_UI_LABELS.UNIT_PERCENT }}</small>
          <small class="sep">)</small>
        </template>
      </template>
    </MoleculesResultBox>

    <!-- Row 2: 48% (同種) -->
    <MoleculesResultBox
      :status="status48"
      :size="size"
    >
      <template #title>
        <span class="flex items-center justify-center gap-2">
          {{ CONDUIT_UI_LABELS.TITLE_48 }}
          <AtomsBadge v-if="vm.isSameSize" color="var(--color-status-success)">適用可 (屈曲小)</AtomsBadge>
          <AtomsBadge v-else-if="vm.isDiffSize" color="var(--color-status-warning)">適用外 (異種混在)</AtomsBadge>
        </span>
      </template>
      <template #value>
        <span>{{ vm.size48 }}</span>
        <template v-if="vm.isReady && !vm.isOversize48">
          <small class="sep">(</small>
          <span class="sub-val">{{ vm.fill48 }}</span>
          <small class="unit">{{ CONDUIT_UI_LABELS.UNIT_PERCENT }}</small>
          <small class="sep">)</small>
        </template>
      </template>
    </MoleculesResultBox>

    <!-- Row 3: ユーザー指定 (customFillRate%) -->
    <MoleculesResultBox
      :title="vm.titleCustom"
      :status="statusCustom"
      :size="size"
    >
      <template #value>
        <span>{{ vm.sizeCustom }}</span>
        <template v-if="vm.isReady && !vm.isOversizeCustom">
          <small class="sep">(</small>
          <span class="sub-val">{{ vm.fillCustom }}</span>
          <small class="unit">{{ CONDUIT_UI_LABELS.UNIT_PERCENT }}</small>
          <small class="sep">)</small>
        </template>
      </template>
    </MoleculesResultBox>

    <!-- Footer: 内線規程（勧告）内容 -->
    <AtomsPanel as="footer" class="flex flex-col gap-2 p-3">
      <div class="footer-title flex items-center gap-1">
        <AtomsIcon name="info" size="sm" />
        <span>内線規程（勧告）</span>
      </div>
      <ul class="footer-list m-0 p-0 flex flex-col gap-1 list-none">
        <li>
          <code>3110-6 (32%以下)</code>: 異なる太さの絶縁電線を同一管内に収める場合（原則）
        </li>
        <li>
          <code>3110-5 (48%以下)</code>: 同一太さで、かつ管の屈曲が少なく引き替えが容易な場合
        </li>
      </ul>
    </AtomsPanel>
  </div>
</template>

<style scoped lang="scss">
.sub-val {
  font-size: var(--font-size-xl);
}

.is-sm .sub-val {
  font-size: var(--font-size-base);
}

footer {
  .footer-title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    color: var(--color-status-warning);
  }

  li {
    font-size: var(--font-size-2xs);
    color: var(--color-text-secondary);
  }

  code {
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
    font-variant-numeric: tabular-nums;
    color: var(--color-text-main);
  }
}
</style>
