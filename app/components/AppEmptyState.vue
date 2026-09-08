<script setup lang="ts">
/**
 * AppEmptyState
 * データが0件の場合や検索結果がない場合に表示する共通の空状態コンポーネント
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
  <div class="empty-state" role="status">
    <AppIcon v-if="icon" :name="icon" class="icon" />

    <div class="content">
      <h3 v-if="title || $slots.title" class="title">
        <slot name="title">
          {{ title }}
        </slot>
      </h3>

      <p v-if="description || $slots.description" class="desc">
        <slot name="description">
          {{ description }}
        </slot>
      </p>

      <slot />
    </div>

    <div v-if="$slots.actions" class="actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.empty-state {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  align-items: center;
  justify-content: center;

  padding: var(--space-8) var(--space-4);

  text-align: center;

  .icon {
    width: var(--icon-size-xxl);
    height: var(--icon-size-xxl);
    color: var(--color-text-muted);
    opacity: 0.5;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    align-items: center;

    max-width: 420px;
  }

  .title {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    letter-spacing: var(--tracking-wide);
  }

  .desc {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    letter-spacing: var(--tracking-normal);
  }

  .actions {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    justify-content: center;
  }
}
</style>
