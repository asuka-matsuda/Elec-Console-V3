<script setup lang="ts">
/**
 * RackCalculator
 * ケーブルラック選定ツールのコンポーネントです。強電・弱電ケーブルのリストと段積み数から最適なラック幅を選定します。
 */
import { useRackCalculator } from '~/composables/tools/useRackCalculator'

useHead({
  title: 'ケーブルラック選定',
})

const {
  inputs,
  maxDepth,
  result,
  addStrongCable,
  removeStrongCable,
  addWeakCable,
  removeWeakCable,
  handleSaveHistory,
  openResetModal,
  mathSteps,
} = useRackCalculator()
</script>

<template>
  <ToolLayout
    title="ケーブルラック選定"
    icon="align-justify"
    description="強電・弱電ケーブルのリストと段積み数から、最適なラック幅を選定します。"
    note="※ 内線規程に基づく概算です。"
  >
    <template #inputs>
      <ToolInputPanel @reset="openResetModal">
        <div class="p-rack__sections">
          <div class="p-rack__grid">
            <AppFormGroup label="ラック深さ (H)">
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

            <AppFormGroup
              v-if="inputs.isStrong && inputs.isWeak"
              label="セパレータ幅"
            >
              <AppInputGroup>
                <AppInput
                  v-model="inputs.separatorWidth"
                  type="number"
                  min="0"
                />
                <template #append>
                  <span class="c-input-addon">mm</span>
                </template>
              </AppInputGroup>
            </AppFormGroup>
          </div>

          <AppPanel title="強電エリア" size="sm">
            <template #actions>
              <AppToggle v-model="inputs.isStrong" label="" />
            </template>

            <div v-if="inputs.isStrong" class="p-rack__panel-body">
              <AppFormGroup label="段積み数">
                <AppInputGroup>
                  <AppInput v-model="inputs.lStrong" type="number" min="1" />
                  <template #append>
                    <span class="c-input-addon">段</span>
                  </template>
                </AppInputGroup>
              </AppFormGroup>

              <div class="p-rack__section">
                <div class="p-rack__section-title">強電ケーブルリスト</div>
                <div class="p-rack__cable-list">
                  <ToolCableCard
                    v-for="(cable, index) in inputs.strongCablesUI"
                    :key="cable.id"
                    v-model="inputs.strongCablesUI[index]!"
                    :index="index"
                    :removable="inputs.strongCablesUI.length > 1"
                    @remove="removeStrongCable(cable.id)"
                  />
                </div>
                <AppButton
                  variant="secondary"
                  class="p-rack__add-button"
                  @click="addStrongCable"
                >
                  <AppIcon name="plus" /> 強電ケーブルを追加
                </AppButton>
              </div>
            </div>
          </AppPanel>

          <AppPanel title="弱電エリア" size="sm">
            <template #actions>
              <AppToggle v-model="inputs.isWeak" label="" />
            </template>

            <div v-if="inputs.isWeak" class="p-rack__panel-body">
              <AppFormGroup label="段積み数">
                <AppInputGroup>
                  <AppInput v-model="inputs.lWeak" type="number" min="1" />
                  <template #append>
                    <span class="c-input-addon">段</span>
                  </template>
                </AppInputGroup>
              </AppFormGroup>

              <div class="p-rack__section">
                <div class="p-rack__section-title">弱電ケーブルリスト</div>
                <div class="p-rack__cable-list">
                  <ToolCableCard
                    v-for="(cable, index) in inputs.weakCablesUI"
                    :key="cable.id"
                    v-model="inputs.weakCablesUI[index]!"
                    :index="index"
                    :removable="inputs.weakCablesUI.length > 1"
                    @remove="removeWeakCable(cable.id)"
                  />
                </div>
                <AppButton
                  variant="secondary"
                  class="p-rack__add-button"
                  @click="addWeakCable"
                >
                  <AppIcon name="plus" /> 弱電ケーブルを追加
                </AppButton>
              </div>
            </div>
          </AppPanel>
        </div>
      </ToolInputPanel>
    </template>

    <template #results>
      <ToolResultPanel
        title="選定結果"
        :save-disabled="result?.error || (!inputs.isStrong && !inputs.isWeak)"
        :save-function="handleSaveHistory"
      >
        <AppResultBox
          title="推奨ラックサイズ"
          :variant="result?.error ? 'error' : 'default'"
          :is-empty="result?.error || (!inputs.isStrong && !inputs.isWeak)"
        >
          <template #value>
            <div class="p-result-rack">
              <div class="p-result-rack__val">
                <template
                  v-if="result?.error || (!inputs.isStrong && !inputs.isWeak)"
                >
                  ---
                </template>
                <template v-else-if="result?.selectedSize">
                  W{{ result?.selectedSize }}
                </template>
                <template v-else>
                  規格外 ({{
                    result?.totalWidth ? Math.ceil(result.totalWidth) : 0
                  }}mm以上)
                </template>
              </div>
              <div v-if="result?.isOverflow" class="p-result-rack__warning">
                ⚠️ ケーブルの高さがラックの有効深さ({{
                  maxDepth
                }}mm)を超過しています。
              </div>
            </div>
          </template>
        </AppResultBox>

        <ToolResultDetails>
          <ToolResultRow label="強電 必要幅">
            <strong>{{ result?.wStrong?.toFixed(1) ?? "0.0" }}</strong> mm
          </ToolResultRow>
          <ToolResultRow label="弱電 必要幅">
            <strong>{{ result?.wWeak?.toFixed(1) ?? "0.0" }}</strong> mm
          </ToolResultRow>
          <ToolResultRow
            v-if="inputs.isStrong && inputs.isWeak"
            label="セパレータ幅"
          >
            <strong>{{ result?.wSep?.toFixed(1) ?? "0.0" }}</strong> mm
          </ToolResultRow>
          <ToolResultRow label="合計 必要幅" top-border>
            <strong>{{
              result?.totalWidth ? Math.ceil(result.totalWidth) : 0
            }}</strong>
            mm
          </ToolResultRow>
          <ToolResultRow label="最大ケーブル高さ">
            <strong :class="{ 'is-overflow': result?.isOverflow }">{{
              result?.maxCableStackHeight?.toFixed(1) ?? "0.0"
            }}</strong>
            mm (有効 {{ maxDepth }} mm)
          </ToolResultRow>
        </ToolResultDetails>
      </ToolResultPanel>
    </template>

    <template #basis>
      <ToolMathBasisPanel :steps="mathSteps" />
    </template>
  </ToolLayout>
</template>

<style scoped lang="scss">
.p-result-rack {
  @include flex-start-stretch($direction: column);

  gap: var(--space-1);

  &__val {
    @include text-title("lg");

    color: var(--color-status-success);

    @include cyber-text-glow(var(--color-status-success), 40%, var(--blur-md));
  }

  &__warning {
    @include text-title("sm");

    padding: var(--space-1) var(--space-2);
    color: var(--color-status-danger);
  }
}

.is-overflow {
  color: var(--color-status-danger);
}

.p-rack {
  &__sections {
    @include flex-start-stretch($direction: column);

    gap: var(--space-card-gap);
  }

  &__grid {
    @include grid(1fr, var(--space-card-gap));

    @include cq("xs") {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  &__panel-body {
    @include flex-start-stretch($direction: column);

    gap: var(--space-card-gap);
  }

  &__section {
    @include flex-start-stretch($direction: column);

    gap: var(--space-1);
  }

  &__section-title {
    @include text-desc;
  }

  &__cable-list {
    @include flex-start-stretch($direction: column);

    gap: var(--space-card-gap);
  }

  &__add-button {
    width: 100%;
  }
}
</style>
