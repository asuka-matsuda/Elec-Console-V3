<script setup lang="ts">
/**
 * ToolConduitResult
 * 配管サイズ計算の結果を視覚的に表示する3段縦積みコンポーネントです。
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
  <div class="conduit-result" :class="[size === 'sm' ? 'is-sm' : '']">
    <!-- Row 1: 32% (異種) -->
    <AppResultBox
      :status="status32"
      :size="size"
    >
      <template #title>
        <span class="box-title">
          {{ CONDUIT_UI_LABELS.TITLE_32 }}
          <AppBadge v-if="vm.isDiffSize" color="var(--color-status-success)">規程推奨</AppBadge>
        </span>
      </template>
      <template #value>
        <span class="value-text main-val">{{ vm.size32 }}</span>
        <template v-if="vm.isReady && !vm.isOversize32">
          <span class="value-sep">(</span>
          <span class="percent is-neutral">{{
            vm.fill32
          }}</span>
          <span class="value-unit percent-unit">{{
            CONDUIT_UI_LABELS.UNIT_PERCENT
          }}</span>
          <span class="value-sep">)</span>
        </template>
      </template>
    </AppResultBox>

    <!-- Row 2: 48% (同種) -->
    <AppResultBox
      :status="status48"
      :size="size"
    >
      <template #title>
        <span class="box-title">
          {{ CONDUIT_UI_LABELS.TITLE_48 }}
          <AppBadge v-if="vm.isSameSize" color="var(--color-status-success)">適用可 (屈曲小)</AppBadge>
          <AppBadge v-else-if="vm.isDiffSize" color="var(--color-status-warning)">適用外 (異種混在)</AppBadge>
        </span>
      </template>
      <template #value>
        <span class="value-text main-val">{{ vm.size48 }}</span>
        <template v-if="vm.isReady && !vm.isOversize48">
          <span class="value-sep">(</span>
          <span class="percent is-neutral">{{
            vm.fill48
          }}</span>
          <span class="value-unit percent-unit">{{
            CONDUIT_UI_LABELS.UNIT_PERCENT
          }}</span>
          <span class="value-sep">)</span>
        </template>
      </template>
    </AppResultBox>

    <!-- Row 3: ユーザー指定 (customFillRate%) -->
    <AppResultBox
      :title="vm.titleCustom"
      :status="statusCustom"
      :size="size"
    >
      <template #value>
        <span class="value-text main-val">{{ vm.sizeCustom }}</span>
        <template v-if="vm.isReady && !vm.isOversizeCustom">
          <span class="value-sep">(</span>
          <span class="percent is-neutral">{{
            vm.fillCustom
          }}</span>
          <span class="value-unit percent-unit">{{
            CONDUIT_UI_LABELS.UNIT_PERCENT
          }}</span>
          <span class="value-sep">)</span>
        </template>
      </template>
    </AppResultBox>

    <!-- Footer: 内線規程（勧告）内容 -->
    <footer class="conduit-footer">
      <div class="footer-title">
        <AppIcon name="info" size="sm" /> 内線規程（勧告）
      </div>
      <ul class="footer-list">
        <li>
          <span class="footer-code">3110-6 (32%以下)</span>: 異なる太さの絶縁電線を同一管内に収める場合（原則）
        </li>
        <li>
          <span class="footer-code">3110-5 (48%以下)</span>: 同一太さで、かつ管の屈曲が少なく引き替えが容易な場合
        </li>
      </ul>
    </footer>
  </div>
</template>

<style scoped lang="scss">
.conduit-result {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-panel-gap);
  align-items: stretch;

  min-height: 0;

  .box-title {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    justify-content: center;
  }

  .main-val {
    font-family: var(--font-mono);
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    font-variant-numeric: tabular-nums;
  }

  .percent {
    font-family: var(--font-mono);
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    font-variant-numeric: tabular-nums;
  }

  .percent-unit {
    font-size: var(--font-size-sm);
    line-height: var(--line-height-base);
    color: var(--color-text-secondary);
  }

  &.is-sm {
    gap: var(--space-3);

    .main-val {
      font-size: var(--font-size-2xl);
    }

    .percent {
      font-size: var(--font-size-base);
    }
  }

  .is-neutral {
    color: var(--color-text-muted);
  }

  .is-success {
    --glow-color: var(--color-status-success);

    color: var(--color-status-success);
    text-shadow: var(--text-glow-md);
  }

  .is-danger {
    --glow-color: var(--color-status-danger);

    color: var(--color-status-danger);
    text-shadow: var(--text-glow-md);
  }

  .value-sep {
    margin: 0 2px;
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
    color: var(--color-text-muted);
  }

  .value-unit {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-bold);
    line-height: var(--line-height-base);
    color: var(--color-text-secondary);

    opacity: 0.8;
  }

  .conduit-footer {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    gap: var(--space-2);

    padding: var(--space-3) var(--space-4);
    border: var(--border-width-base) solid var(--color-border-subtle);
    border-radius: var(--radius-sm);

    background: var(--surface-bg);

    .footer-title {
      display: flex;
      gap: var(--space-1);
      align-items: center;

      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-bold);
      line-height: var(--line-height-base);
      color: var(--color-status-warning);
    }

    .footer-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);

      margin: 0;
      padding-left: 0;

      list-style: none;

      li {
        font-size: var(--font-size-2xs);
        line-height: var(--line-height-base);
        color: var(--color-text-secondary);
      }
    }

    .footer-code {
      font-family: var(--font-mono);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      font-variant-numeric: tabular-nums;
      color: var(--color-text-main);
    }
  }
}
</style>
