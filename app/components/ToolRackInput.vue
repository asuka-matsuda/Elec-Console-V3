<script setup lang="ts">
/**
 * ToolRackInput
 * ケーブルラック選定ツールの条件入力コンポーネントです。
 * ラック深さ・セパレータ幅および強電・弱電エリアの条件を管理します。
 */
import type { RackInputs } from '~/utils/tools/rack/rackMapper'

const inputs = defineModel<RackInputs>({ required: true })

defineEmits<{
  'add-strong-cable': []
  'remove-strong-cable': [id: string]
  'add-weak-cable': []
  'remove-weak-cable': [id: string]
}>()
</script>

<template>
  <div class="c-rack-input">
    <div class="c-rack-input__grid">
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

    <!-- 強電エリア -->
    <AppPanel title="強電エリア" size="sm">
      <template #actions>
        <AppToggle v-model="inputs.isStrong" label="" />
      </template>

      <template v-if="inputs.isStrong">
        <AppFormGroup label="段積み数">
          <AppInputGroup>
            <AppInput v-model="inputs.lStrong" type="number" min="1" />
            <template #append>
              <span class="c-input-addon">段</span>
            </template>
          </AppInputGroup>
        </AppFormGroup>

        <section class="c-rack-input__section">
          <h4 class="c-rack-input__section-title">
            強電ケーブルリスト
          </h4>
          <ToolCableItemCard
            v-for="(cable, index) in inputs.strongCablesUI"
            :key="cable.id"
            v-model="inputs.strongCablesUI[index]!"
            :index="index"
            :removable="inputs.strongCablesUI.length > 1"
            @remove="$emit('remove-strong-cable', cable.id)"
          />
          <AppButton
            variant="secondary"
            @click="$emit('add-strong-cable')"
          >
            <AppIcon name="plus" /> 強電ケーブルを追加
          </AppButton>
        </section>
      </template>
    </AppPanel>

    <!-- 弱電エリア -->
    <AppPanel title="弱電エリア" size="sm">
      <template #actions>
        <AppToggle v-model="inputs.isWeak" label="" />
      </template>

      <template v-if="inputs.isWeak">
        <AppFormGroup label="段積み数">
          <AppInputGroup>
            <AppInput v-model="inputs.lWeak" type="number" min="1" />
            <template #append>
              <span class="c-input-addon">段</span>
            </template>
          </AppInputGroup>
        </AppFormGroup>

        <section class="c-rack-input__section">
          <h4 class="c-rack-input__section-title">
            弱電ケーブルリスト
          </h4>
          <ToolCableItemCard
            v-for="(cable, index) in inputs.weakCablesUI"
            :key="cable.id"
            v-model="inputs.weakCablesUI[index]!"
            :index="index"
            :removable="inputs.weakCablesUI.length > 1"
            @remove="$emit('remove-weak-cable', cable.id)"
          />
          <AppButton
            variant="secondary"
            @click="$emit('add-weak-cable')"
          >
            <AppIcon name="plus" /> 弱電ケーブルを追加
          </AppButton>
        </section>
      </template>
    </AppPanel>
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

  &__section {
    @include flex-start-stretch($direction: column);

    gap: var(--space-card-gap);
  }

  &__section-title {
    @include text-meta("xs", "bold");
  }
}
</style>
