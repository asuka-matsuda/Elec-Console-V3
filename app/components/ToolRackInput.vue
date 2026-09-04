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

      <div v-if="inputs.isStrong" class="c-rack-input__panel-body">
        <AppFormGroup label="段積み数">
          <AppInputGroup>
            <AppInput v-model="inputs.lStrong" type="number" min="1" />
            <template #append>
              <span class="c-input-addon">段</span>
            </template>
          </AppInputGroup>
        </AppFormGroup>

        <div class="c-rack-input__section">
          <small class="c-rack-input__section-title">強電ケーブルリスト</small>
          <div class="c-rack-input__cable-list">
            <ToolCableItemCard
              v-for="(cable, index) in inputs.strongCablesUI"
              :key="cable.id"
              v-model="inputs.strongCablesUI[index]!"
              :index="index"
              :removable="inputs.strongCablesUI.length > 1"
              @remove="$emit('remove-strong-cable', cable.id)"
            />
          </div>
          <AppButton
            variant="secondary"
            class="c-rack-input__add-button"
            @click="$emit('add-strong-cable')"
          >
            <AppIcon name="plus" /> 強電ケーブルを追加
          </AppButton>
        </div>
      </div>
    </AppPanel>

    <!-- 弱電エリア -->
    <AppPanel title="弱電エリア" size="sm">
      <template #actions>
        <AppToggle v-model="inputs.isWeak" label="" />
      </template>

      <div v-if="inputs.isWeak" class="c-rack-input__panel-body">
        <AppFormGroup label="段積み数">
          <AppInputGroup>
            <AppInput v-model="inputs.lWeak" type="number" min="1" />
            <template #append>
              <span class="c-input-addon">段</span>
            </template>
          </AppInputGroup>
        </AppFormGroup>

        <div class="c-rack-input__section">
          <small class="c-rack-input__section-title">弱電ケーブルリスト</small>
          <div class="c-rack-input__cable-list">
            <ToolCableItemCard
              v-for="(cable, index) in inputs.weakCablesUI"
              :key="cable.id"
              v-model="inputs.weakCablesUI[index]!"
              :index="index"
              :removable="inputs.weakCablesUI.length > 1"
              @remove="$emit('remove-weak-cable', cable.id)"
            />
          </div>
          <AppButton
            variant="secondary"
            class="c-rack-input__add-button"
            @click="$emit('add-weak-cable')"
          >
            <AppIcon name="plus" /> 弱電ケーブルを追加
          </AppButton>
        </div>
      </div>
    </AppPanel>
  </div>
</template>

<style scoped lang="scss">
.c-rack-input {
  @include flex-start-stretch($direction: column);

  gap: var(--space-card-gap);

  &__grid {
    @include grid(repeat(2, minmax(0, 1fr)));

    @include mq("sm") {
      grid-template-columns: 1fr;
    }
  }

  &__panel-body {
    @include flex-start-stretch($direction: column);

    gap: var(--space-card-gap);
  }

  &__section {
    @include flex-start-stretch($direction: column);

    gap: var(--space-card-gap);
  }

  &__section-title {
    @include text-meta("xs", "bold");
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
