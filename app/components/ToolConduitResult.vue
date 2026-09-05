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
  <div class="c-conduit-result" :class="[size === 'sm' ? 'is-sm' : '']">
    <!-- Row 1: 32% (異種) -->
    <AppResultBox
      :status="status32"
      :size="size"
    >
      <template #title>
        <span class="c-conduit-result__box-title">
          {{ CONDUIT_UI_LABELS.TITLE_32 }}
          <AppBadge v-if="vm.isDiffSize" color="success">規程推奨</AppBadge>
        </span>
      </template>
      <template #value>
        <span class="value-text c-conduit-result__main-val">{{ vm.size32 }}</span>
        <template v-if="vm.isReady && !vm.isOversize32">
          <span class="value-sep">(</span>
          <span class="c-conduit-result__percent is-neutral">{{
            vm.fill32
          }}</span>
          <span class="value-unit c-conduit-result__percent-unit">{{
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
        <span class="c-conduit-result__box-title">
          {{ CONDUIT_UI_LABELS.TITLE_48 }}
          <AppBadge v-if="vm.isSameSize" color="success">適用可 (屈曲小)</AppBadge>
          <AppBadge v-else-if="vm.isDiffSize" color="warning">適用外 (異種混在)</AppBadge>
        </span>
      </template>
      <template #value>
        <span class="value-text c-conduit-result__main-val">{{ vm.size48 }}</span>
        <template v-if="vm.isReady && !vm.isOversize48">
          <span class="value-sep">(</span>
          <span class="c-conduit-result__percent is-neutral">{{
            vm.fill48
          }}</span>
          <span class="value-unit c-conduit-result__percent-unit">{{
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
        <span class="value-text c-conduit-result__main-val">{{ vm.sizeCustom }}</span>
        <template v-if="vm.isReady && !vm.isOversizeCustom">
          <span class="value-sep">(</span>
          <span class="c-conduit-result__percent is-neutral">{{
            vm.fillCustom
          }}</span>
          <span class="value-unit c-conduit-result__percent-unit">{{
            CONDUIT_UI_LABELS.UNIT_PERCENT
          }}</span>
          <span class="value-sep">)</span>
        </template>
      </template>
    </AppResultBox>

    <!-- Footer: 内線規程（勧告）内容 -->
    <footer class="c-conduit-result__footer">
      <div class="c-conduit-result__footer-title">
        <AppIcon name="info" size="sm" /> 内線規程（勧告）
      </div>
      <ul class="c-conduit-result__footer-list">
        <li>
          <span class="c-conduit-result__footer-code">3110-6 (32%以下)</span>: 異なる太さの絶縁電線を同一管内に収める場合（原則）
        </li>
        <li>
          <span class="c-conduit-result__footer-code">3110-5 (48%以下)</span>: 同一太さで、かつ管の屈曲が少なく引き替えが容易な場合
        </li>
      </ul>
    </footer>
  </div>
</template>

<style scoped lang="scss">
.c-conduit-result {
  @include flex-start-stretch($direction: column);

  flex: 1;
  gap: var(--space-card-gap);
  align-items: stretch;
  min-height: 0;

  &__box-title {
    @include flex-center-center;

    gap: var(--space-2);
  }

  &__main-val {
    @include text-mono("3xl", "bold");
  }

  &__percent {
    @include text-mono("xl", "bold");
  }

  &__percent-unit {
    @include text-body("sm");

    color: var(--color-text-secondary);
  }

  &.is-sm {
    gap: var(--space-3);

    .c-conduit-result__main-val {
      @include text-mono("2xl", "bold");
    }

    .c-conduit-result__percent {
      @include text-mono("base", "bold");
    }
  }

  .is-neutral {
    color: var(--color-text-muted);
  }

  .is-success {
    color: var(--color-status-success);

    @include cyber-text-glow(var(--color-status-success), 40%, var(--blur-md));
  }

  .is-danger {
    color: var(--color-status-danger);

    @include cyber-text-glow(var(--color-status-danger), 40%, var(--blur-md));
  }

  &.is-sm {
    gap: var(--space-3);

    .c-conduit-result__percent {
      @include text-mono("base");
    }
  }

  .value-sep {
    @include text-body("md", "normal");

    margin: 0 2px;
    color: var(--color-text-muted);
  }

  .value-unit {
    @include text-body("md", "bold");

    color: var(--color-text-secondary);
    opacity: 0.8;
  }

  &__footer {
    @include flex-start-stretch($direction: column);

    flex-shrink: 0;
    gap: var(--space-2);

    padding: var(--space-3) var(--space-4);
    border: var(--border-width-base) solid var(--color-border-subtle);
    border-radius: var(--radius-md);

    background: var(--color-surface-panel-subtle);
  }

  &__footer-title {
    @include text-desc("bold");
    @include flex-start-center;

    gap: var(--space-1);
    color: var(--color-status-warning);
  }

  &__footer-list {
    @include flex-start-stretch($direction: column);

    gap: var(--space-1);
    margin: 0;
    padding-left: 0;
    list-style: none;

    li {
      @include text-meta;

      line-height: var(--line-height-normal);
      color: var(--color-text-secondary);
    }
  }

  &__footer-code {
    @include text-mono("xs");

    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
  }
}
</style>
