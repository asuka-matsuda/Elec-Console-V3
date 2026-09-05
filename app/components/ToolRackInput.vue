<script setup lang="ts">
/**
 * ToolRackInput
 * ケーブルラック選定ツールの条件入力コンポーネントです。
 * 強電／弱電タブ切替、ラック高さ、相乗り必要幅、計算パラメータ、およびケーブル条件を管理します。
 */
import { watch } from 'vue'

import { RACK_DEFAULT_PARAMS, rackModeOptions } from '~/constants/rackConstants'
import type { RackInputs } from '~/utils/tools/rack/rackMapper'

const inputs = defineModel<RackInputs>({ required: true })

const emit = defineEmits<{
  'add-strong-cable': []
  'remove-strong-cable': [id: string]
  'add-weak-cable': []
  'remove-weak-cable': [id: string]
}>()

// モード切替時にデフォルトパラメータを適応（カスタム値がなければ自動追従）
watch(
  () => inputs.value.mode,
  (newMode, oldMode) => {
    if (!oldMode) return
    const oldDefaults = RACK_DEFAULT_PARAMS[oldMode]
    const newDefaults = RACK_DEFAULT_PARAMS[newMode]

    if (inputs.value.marginRate === null || inputs.value.marginRate === oldDefaults.marginRate) {
      inputs.value.marginRate = newDefaults.marginRate
    }
    if (inputs.value.sideMargin === null || inputs.value.sideMargin === oldDefaults.sideMargin) {
      inputs.value.sideMargin = newDefaults.sideMargin
    }
  },
)
</script>

<template>
  <div class="c-rack-input">
    <!-- 強電／弱電 タブ切り替え -->
    <AppRadioGroup
      v-model="inputs.mode"
      :options="rackModeOptions"
    />

    <!-- 基本条件（ラック高さ、相乗り必要幅） -->
    <div class="c-rack-input__grid">
      <AppFormGroup label="ラック高さ (H)">
        <AppInputGroup>
          <AppInput
            v-model="inputs.rackHeight"
            type="number"
            min="50"
            step="10"
          />
          <template #append>
            <span class="c-input-addon">mm</span>
          </template>
        </AppInputGroup>
      </AppFormGroup>

      <AppFormGroup :label="inputs.mode === 'strong' ? '弱電必要幅' : '強電必要幅'">
        <AppInputGroup>
          <AppInput
            v-model="inputs.otherWidth"
            type="number"
            min="0"
            placeholder="相乗り時に指定"
          />
          <template #append>
            <span class="c-input-addon">mm</span>
          </template>
        </AppInputGroup>
      </AppFormGroup>
    </div>

    <!-- 詳細設定（計算パラメータ） -->
    <details class="c-rack-input__details">
      <summary class="c-rack-input__details-summary">
        <AppIcon name="sliders" size="sm" />
        <span>計算パラメータ設定（余裕係数・離隔など）</span>
      </summary>
      <div class="c-rack-input__params-grid">
        <AppFormGroup label="余裕係数">
          <AppInputGroup>
            <AppInput
              v-model.number="inputs.marginRate"
              type="number"
              step="0.05"
              min="0.1"
              :placeholder="inputs.mode === 'strong' ? '1.2' : '0.6'"
            />
            <template #append>
              <span class="c-input-addon">倍</span>
            </template>
          </AppInputGroup>
        </AppFormGroup>

        <AppFormGroup label="ケーブル間隔">
          <AppInputGroup>
            <AppInput
              v-model.number="inputs.cableSpacing"
              type="number"
              min="0"
              placeholder="10"
            />
            <template #append>
              <span class="c-input-addon">mm</span>
            </template>
          </AppInputGroup>
        </AppFormGroup>

        <AppFormGroup label="親桁クリアランス">
          <AppInputGroup>
            <AppInput
              v-model.number="inputs.sideMargin"
              type="number"
              min="0"
              :placeholder="inputs.mode === 'strong' ? '60' : '120'"
            />
            <template #append>
              <span class="c-input-addon">mm</span>
            </template>
          </AppInputGroup>
        </AppFormGroup>
      </div>
    </details>

    <!-- ケーブル条件セクション（テーブル形式） -->
    <section class="c-rack-input__section">
      <div class="c-rack-input__section-header">
        <div class="c-rack-input__section-title-group">
          <AppIcon name="layers" size="sm" />
          <h4 class="c-rack-input__section-title">
            {{ inputs.mode === 'strong' ? '強電ケーブルリスト' : '弱電ケーブルリスト' }}
          </h4>
          <span class="c-rack-input__count-badge">
            {{ (inputs.mode === 'strong' ? inputs.strongCablesUI : inputs.weakCablesUI).length }}件
          </span>
        </div>
      </div>

      <ToolCableTableInput
        v-if="inputs.mode === 'strong'"
        v-model="inputs.strongCablesUI"
        filter="strong"
        spec-type="diameter"
        add-label="強電ケーブルを追加"
        @add="emit('add-strong-cable')"
        @remove="(id) => emit('remove-strong-cable', id)"
      />
      <ToolCableTableInput
        v-else
        v-model="inputs.weakCablesUI"
        filter="weak"
        spec-type="diameter"
        add-label="弱電ケーブルを追加"
        @add="emit('add-weak-cable')"
        @remove="(id) => emit('remove-weak-cable', id)"
      />
    </section>
  </div>
</template>

<style scoped lang="scss">
.c-rack-input {
  @include flex-start-stretch($direction: column);

  gap: var(--space-form-row-gap);

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-form-row-gap) var(--space-form-col-gap);

    @include mq("sm") {
      grid-template-columns: 1fr;
    }
  }

  &__details {
    padding: var(--space-2) var(--space-3);
    border: var(--border-width-base) solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    background: var(--color-surface-panel-subtle);

    &[open] {
      padding-bottom: var(--space-3);
    }
  }

  &__details-summary {
    @include flex-start-center;
    @include text-meta("xs", "bold");

    cursor: pointer;
    user-select: none;
    gap: var(--space-2);
    color: var(--color-text-secondary);

    &:hover {
      color: var(--color-text-main);
    }
  }

  &__params-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-form-row-gap) var(--space-form-col-gap);
    margin-top: var(--space-3);

    @include mq("sm") {
      grid-template-columns: 1fr;
    }
  }

  &__section {
    @include flex-start-stretch($direction: column);

    gap: var(--space-item-gap);
  }

  &__section-header {
    @include flex-between-center;

    padding: var(--space-1) 0;
  }

  &__section-title-group {
    @include flex-start-center;

    gap: var(--space-2);
    color: var(--color-text-main);
  }

  &__section-title {
    @include text-meta("xs", "bold");
  }

  &__count-badge {
    font-size: var(--font-size-2xs);
    color: var(--color-text-muted);
    background: var(--surface-bg-elevated);
    border: 1px solid var(--color-border-subtle);
    padding: var(--space-0-5) var(--space-1);
    border-radius: var(--radius-full, 9999px);
  }
}
</style>
