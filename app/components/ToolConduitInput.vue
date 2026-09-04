<script setup lang="ts">
/**
 * ToolConduitInput
 * 配管サイズ自動選定ツールの条件入力コンポーネントです。
 * 対象の配管種類と収容するケーブルリストの入力を管理します。
 */
import type { SelectOption } from '~/types/components'
import type { ConduitInputData } from '~/types/tools'

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

    <section class="c-conduit-input__section">
      <h4 class="c-conduit-input__title">
        収容するケーブル
      </h4>

      <ToolCableItemCard
        v-for="(cable, index) in inputs.inputCables"
        :key="cable.id"
        v-model="inputs.inputCables[index]!"
        :index="index"
        :removable="inputs.inputCables.length > 1"
        @remove="emit('remove-cable', cable.id)"
      />

      <AppButton
        variant="success"
        @click="emit('add-cable')"
      >
        <AppIcon name="plus" /> ケーブルを追加
      </AppButton>
    </section>
  </div>
</template>

<style scoped lang="scss">
.c-conduit-input {
  @include flex-start-stretch($direction: column);

  gap: var(--space-form-row-gap);

  &__section {
    @include flex-start-stretch($direction: column);

    gap: var(--space-form-row-gap);
  }

  &__title {
    @include text-title("sm");
  }
}
</style>
