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
    <div class="c-conduit-input__header-grid">
      <AppFormGroup label="対象の配管種類" class="c-conduit-input__category">
        <AppSelect
          v-model="inputs.conduitCategory"
          :options="categoryOptions"
          placeholder="選択してください"
        />
      </AppFormGroup>

      <AppFormGroup label="占積率" class="c-conduit-input__fill-rate">
        <AppInputGroup>
          <AppInput
            v-model.number="inputs.customFillRate"
            type="number"
            min="1"
            max="100"
            placeholder="80"
          />
          <template #append>
            <span class="c-input-addon">%</span>
          </template>
        </AppInputGroup>
      </AppFormGroup>
    </div>

    <section class="c-conduit-input__section">
      <div class="c-conduit-input__section-header">
        <div class="c-conduit-input__title-group">
          <AppIcon name="layers" size="sm" />
          <h4 class="c-conduit-input__title">
            収容するケーブル
          </h4>
          <span class="c-conduit-input__count-badge">
            {{ inputs.inputCables.length }}件
          </span>
        </div>
      </div>

      <ToolCableTableInput
        v-model="inputs.inputCables"
        spec-type="area"
        add-label="ケーブルを追加"
        @add="emit('add-cable')"
        @remove="(id) => emit('remove-cable', id)"
      />
    </section>
  </div>
</template>

<style scoped lang="scss">
.c-conduit-input {
  @include flex-start-stretch($direction: column);

  gap: var(--space-form-row-gap);

  &__header-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.8fr) minmax(130px, 1fr);
    gap: var(--space-form-row-gap);

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

  &__title-group {
    @include flex-start-center;

    gap: var(--space-2);
    color: var(--color-text-main);
  }

  &__title {
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
