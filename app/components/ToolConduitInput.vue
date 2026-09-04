<script setup lang="ts">
/**
 * ToolConduitInput
 * 配管サイズ自動選定ツールの条件入力コンポーネントです。
 * 対象の配管種類と収容するケーブルリストの入力を管理します。
 */
import type { SelectOption } from '~/components/AppSelect.vue'
import type { CableInputItem } from '~/components/ToolCableItemCard.vue'

export interface ConduitInputData {
  conduitCategory: string
  inputCables: CableInputItem[]
}

const inputs = defineModel<ConduitInputData>({ required: true })

defineProps<{
  categoryOptions: SelectOption[]
}>()

const emit = defineEmits<{
  'add-cable': []
  'remove-cable': [id: string]
}>()
</script>

<template>
  <div class="c-conduit-input">
    <AppFormGroup label="対象の配管種類">
      <AppSelect
        v-model="inputs.conduitCategory"
        :options="categoryOptions"
        placeholder="選択してください"
      />
    </AppFormGroup>

    <div class="c-conduit-input__section">
      <h4>収容するケーブル</h4>

      <div class="c-conduit-input__cable-list">
        <ToolCableItemCard
          v-for="(cable, index) in inputs.inputCables"
          :key="cable.id"
          v-model="inputs.inputCables[index]!"
          :index="index"
          :removable="inputs.inputCables.length > 1"
          @remove="emit('remove-cable', cable.id)"
        />
      </div>

      <AppButton
        variant="success"
        class="c-conduit-input__add-button"
        @click="emit('add-cable')"
      >
        <AppIcon name="plus" /> ケーブルを追加
      </AppButton>
    </div>
  </div>
</template>

<style scoped lang="scss">
.c-conduit-input {
  @include flex-start-stretch($direction: column);

  gap: var(--space-card-gap);

  &__section {
    @include flex-start-stretch($direction: column);

    gap: var(--space-card-gap);
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
