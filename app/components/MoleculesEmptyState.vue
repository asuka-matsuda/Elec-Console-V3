<script setup lang="ts">
/**
 * MoleculesEmptyState
 * [Molecules] データが0件の場合や検索結果がない場合に表示する共通の空状態コンポーネント。
 */
const {
  icon = 'inbox',
  title = 'データがありません',
  description,
} = defineProps<{
  icon?: string
  title?: string
  description?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-1.5 py-8 px-4 text-center empty-state" role="status">
    <slot name="icon">
      <AtomsIcon v-if="icon" :name="icon" size="xxl" class="mb-1.5" />
    </slot>

    <h3 class="title">
      <slot>{{ title }}</slot>
    </h3>

    <p v-if="description" class="desc">
      <slot name="description">{{ description }}</slot>
    </p>

    <div v-if="$slots.actions" class="flex items-center justify-center gap-2 mt-2">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.empty-state {
  max-width: 420px;
  margin-inline: auto;
  color: var(--color-text-muted);
  opacity: 0.8;

  .title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    letter-spacing: var(--tracking-wide);
  }

  .desc {
    font-size: var(--font-size-sm);
    letter-spacing: var(--tracking-normal);
  }
}
</style>
