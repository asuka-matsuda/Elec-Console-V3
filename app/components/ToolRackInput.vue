<script setup lang="ts">
/**
 * ToolRackInput
 * ケーブルラック選定ツールの条件入力コンポーネントです。
 * 強電／弱電タブ切替、ラック高さ、相乗り必要幅、およびケーブル条件を管理します。
 */
import { rackModeOptions } from '~/constants/rackConstants'
import type { RackInputs } from '~/utils/tools/rack/rackMapper'

const inputs = defineModel<RackInputs>({ required: true })

const emit = defineEmits<{
  'add-strong-cable': []
  'remove-strong-cable': [id: string]
  'add-weak-cable': []
  'remove-weak-cable': [id: string]
}>()
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

    <!-- ケーブル条件パネル -->
    <AppPanel
      :title="inputs.mode === 'strong' ? '強電ケーブル条件' : '弱電ケーブル条件'"
      size="sm"
    >
      <AppFormGroup label="段積み数">
        <AppInputGroup>
          <AppInput
            v-if="inputs.mode === 'strong'"
            v-model="inputs.lStrong"
            type="number"
            min="1"
          />
          <AppInput
            v-else
            v-model="inputs.lWeak"
            type="number"
            min="1"
          />
          <template #append>
            <span class="c-input-addon">段</span>
          </template>
        </AppInputGroup>
      </AppFormGroup>

      <section class="c-rack-input__section">
        <h4 class="c-rack-input__section-title">
          {{ inputs.mode === 'strong' ? '強電ケーブルリスト' : '弱電ケーブルリスト' }}
        </h4>

        <template v-if="inputs.mode === 'strong'">
          <ToolCableItemCard
            v-for="(cable, index) in inputs.strongCablesUI"
            :key="cable.id"
            v-model="inputs.strongCablesUI[index]!"
            :index="index"
            :filter="'strong'"
            :removable="inputs.strongCablesUI.length > 1"
            @remove="emit('remove-strong-cable', cable.id)"
          />
          <AppButton
            variant="secondary"
            @click="emit('add-strong-cable')"
          >
            <AppIcon name="plus" /> 強電ケーブルを追加
          </AppButton>
        </template>

        <template v-else>
          <ToolCableItemCard
            v-for="(cable, index) in inputs.weakCablesUI"
            :key="cable.id"
            v-model="inputs.weakCablesUI[index]!"
            :index="index"
            :filter="'weak'"
            :removable="inputs.weakCablesUI.length > 1"
            @remove="emit('remove-weak-cable', cable.id)"
          />
          <AppButton
            variant="secondary"
            @click="emit('add-weak-cable')"
          >
            <AppIcon name="plus" /> 弱電ケーブルを追加
          </AppButton>
        </template>
      </section>
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
