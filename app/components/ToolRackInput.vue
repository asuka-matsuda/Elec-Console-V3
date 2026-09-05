<script setup lang="ts">
/**
 * ToolRackInput
 * ケーブルラック選定ツールの条件入力コンポーネントです。
 * ラック深さ・セパレータ幅および強電・弱電エリアの条件を管理します。
 */
import { computed } from 'vue'

import type { RackInputs } from '~/utils/tools/rack/rackMapper'

const inputs = defineModel<RackInputs>({ required: true })

const emit = defineEmits<{
  'add-strong-cable': []
  'remove-strong-cable': [id: string]
  'add-weak-cable': []
  'remove-weak-cable': [id: string]
}>()

const areaSections = computed(() => [
  {
    key: 'strong' as const,
    title: '強電エリア',
    cablesTitle: '強電ケーブルリスト',
    addButtonText: '強電ケーブルを追加',
    enabled: inputs.value.isStrong,
    toggle: (val?: boolean) => {
      inputs.value.isStrong = !!val
    },
    get layers() {
      return inputs.value.lStrong
    },
    set layers(val: number | null) {
      inputs.value.lStrong = val
    },
    cables: inputs.value.strongCablesUI,
    onAdd: () => emit('add-strong-cable'),
    onRemove: (id: string) => emit('remove-strong-cable', id),
  },
  {
    key: 'weak' as const,
    title: '弱電エリア',
    cablesTitle: '弱電ケーブルリスト',
    addButtonText: '弱電ケーブルを追加',
    enabled: inputs.value.isWeak,
    toggle: (val?: boolean) => {
      inputs.value.isWeak = !!val
    },
    get layers() {
      return inputs.value.lWeak
    },
    set layers(val: number | null) {
      inputs.value.lWeak = val
    },
    cables: inputs.value.weakCablesUI,
    onAdd: () => emit('add-weak-cable'),
    onRemove: (id: string) => emit('remove-weak-cable', id),
  },
])
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

    <!-- 強電／弱電エリア -->
    <AppPanel
      v-for="section in areaSections"
      :key="section.key"
      :title="section.title"
      size="sm"
    >
      <template #actions>
        <AppToggle
          :model-value="section.enabled"
          label=""
          @update:model-value="section.toggle"
        />
      </template>

      <template v-if="section.enabled">
        <AppFormGroup label="段積み数">
          <AppInputGroup>
            <AppInput v-model="section.layers" type="number" min="1" />
            <template #append>
              <span class="c-input-addon">段</span>
            </template>
          </AppInputGroup>
        </AppFormGroup>

        <section class="c-rack-input__section">
          <h4 class="c-rack-input__section-title">
            {{ section.cablesTitle }}
          </h4>
          <ToolCableItemCard
            v-for="(cable, index) in section.cables"
            :key="cable.id"
            v-model="section.cables[index]!"
            :index="index"
            :removable="section.cables.length > 1"
            @remove="section.onRemove(cable.id)"
          />
          <AppButton
            variant="secondary"
            @click="section.onAdd"
          >
            <AppIcon name="plus" /> {{ section.addButtonText }}
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
