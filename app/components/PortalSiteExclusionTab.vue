<script setup lang="ts">
/**
 * PortalSiteExclusionTab
 * 現場設定モーダル - 除外回路設定タブOrganismコンポーネント。
 * 計算や連携の対象外とする回路の追加・一覧・削除を管理します。
 */
const excludedCircuitsList = defineModel<string[]>({ default: () => [] })

defineProps<{
  addCircuit: () => void
  removeCircuit: (index: number) => void
}>()
</script>

<template>
  <div class="portal-site-exclusion-tab">
    <AppFormGroup label="除外回路の設定">
      <template #description>
        計算や連携の対象外とする回路を複数追加できます。
      </template>

      <div class="portal-site-exclusion-tab__container">
        <ul v-if="excludedCircuitsList.length > 0" class="portal-site-exclusion-tab__list">
          <li
            v-for="(_, idx) in excludedCircuitsList"
            :key="idx"
            class="portal-site-exclusion-tab__row"
          >
            <AppInput
              v-model="excludedCircuitsList[idx]"
              placeholder="例: 盤A-回路1"
            />
            <MoleculesIconButton
              name="trash-2"
              variant="danger"
              size="sm"
              title="除外回路を削除"
              @click="removeCircuit(idx)"
            />
          </li>
        </ul>

        <AppEmptyState
          v-else
          icon="slash"
          title="除外回路は設定されていません"
          description="すべての回路が計算・連携の対象となります。"
        />

        <AtomsButton
          variant="secondary"
          icon="plus"
          size="sm"
          @click="addCircuit"
        >
          除外回路を追加する
        </AtomsButton>
      </div>
    </AppFormGroup>
  </div>
</template>

<style scoped lang="scss">
.portal-site-exclusion-tab {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);

  &__container {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);

    margin: 0;
    padding: 0;

    list-style: none;
  }

  &__row {
    display: flex;
    gap: var(--space-2);
    align-items: center;
  }
}
</style>
