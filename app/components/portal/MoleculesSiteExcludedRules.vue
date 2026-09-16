<script setup lang="ts">
/**
 * MoleculesSiteExcludedRules
 * [Portal Molecules] 現場管理の除外回路ルール設定セクション。
 * 計算や試験連携の対象外とする盤・回路の追加・編集・削除を提供します。
 */
defineProps<{
  excludedCircuitsList: string[]
}>()

const emit = defineEmits<{
  'add-circuit': []
  'remove-circuit': [idx: number]
  'update:circuit': [payload: { index: number, value: string }]
}>()
</script>

<template>
  <div class="flex flex-col gap-4 max-w-xl">
    <MoleculesSectionHeader
      title="除外回路の設定"
      icon="slash"
      size="sm"
    />
    <p class="desc-text m-0">
      計算や試験連携の対象外とする盤・回路を指定します。
    </p>

    <div class="flex flex-col gap-3">
      <ul v-if="excludedCircuitsList.length > 0" class="m-0 flex flex-col gap-2 p-0 list-none">
        <li
          v-for="(circuit, idx) in excludedCircuitsList"
          :key="idx"
          class="flex items-center gap-2"
        >
          <AtomsInput
            :model-value="circuit"
            placeholder="例: 盤A-回路1"
            @update:model-value="emit('update:circuit', { index: idx, value: String($event ?? '') })"
          />
          <Button
            icon="trash-2"
            variant="danger"
            title="除外回路を削除"
            @click="emit('remove-circuit', idx)"
          />
        </li>
      </ul>

      <MoleculesEmptyState
        v-else
        icon="slash"
        title="除外回路は設定されていません"
        description="すべての回路が計算・連携の対象となります。"
      />

      <div>
        <Button
          icon="plus"
          @click="emit('add-circuit')"
        >
          除外回路を追加する
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.desc-text {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-base);
  color: var(--color-text-muted);
}
</style>
