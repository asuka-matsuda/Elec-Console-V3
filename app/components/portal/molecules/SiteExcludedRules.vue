<script setup lang="ts">
/**
 * SiteExcludedRules
 * [Portal Molecules] 現場管理の除外回路ルール設定セクション。
 * 計算や試験連携の対象外とする盤・回路の追加・編集・削除を提供します。
 */
const props = defineProps<{
  modelValue: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [val: string[]]
}>()

const handleUpdate = (index: number, val: string | number | null | undefined) => {
  const next = [...props.modelValue]

  next[index] = String(val ?? '')
  emit('update:modelValue', next)
}

const handleRemove = (index: number) => {
  emit('update:modelValue', props.modelValue.filter((_, i) => i !== index))
}

const handleAdd = () => {
  emit('update:modelValue', [...props.modelValue, ''])
}
</script>

<template>
  <div class="flex flex-col gap-4 max-w-xl">
    <SectionHeader
      title="除外回路の設定"
      icon="slash"
      tag="h4"
    />
    <p class="desc-text m-0">
      計算や試験連携の対象外とする盤・回路を指定します。
    </p>

    <ul
      v-if="modelValue.length > 0"
      class="m-0 flex flex-col gap-2 p-0 list-none"
    >
      <li
        v-for="(circuit, idx) in modelValue"
        :key="idx"
        class="flex items-center gap-2"
      >
        <Input
          :model-value="circuit"
          placeholder="例: 盤A-回路1"
          @update:model-value="handleUpdate(idx, $event)"
        />
        <Button
          icon="trash-2"
          variant="danger"
          @click="handleRemove(idx)"
        />
      </li>
    </ul>

    <EmptyState
      v-else
      icon="slash"
      title="除外回路は設定されていません"
      description="すべての回路が計算・連携の対象となります。"
    />

    <Button
      icon="plus"
      class="w-fit"
      @click="handleAdd"
    >
      除外回路を追加する
    </Button>
  </div>
</template>

<style scoped lang="scss">
.desc-text {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-base);
  color: var(--color-text-muted);
}
</style>
