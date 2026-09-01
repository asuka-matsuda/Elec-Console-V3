<script setup lang="ts">
/**
 * AppEmptyState
 * データが0件の場合や検索結果がない場合に表示する共通の空状態コンポーネント
 */
withDefaults(
  defineProps<{
    icon?: string
    title?: string
    description?: string
  }>(),
  {
    icon: 'inbox',
    title: 'データがありません',
    description: undefined,
  },
)
</script>

<template>
  <div class="c-empty-state">
    <div
      v-if="icon"
      class="c-empty-state__icon-wrapper"
    >
      <AppIcon
        :name="icon"
        size="lg"
        class="c-empty-state__icon"
      />
    </div>

    <div class="c-empty-state__content">
      <h3
        v-if="title"
        class="c-empty-state__title"
      >
        <slot name="title">
          {{ title }}
        </slot>
      </h3>

      <p
        v-if="description || $slots.description"
        class="c-empty-state__desc"
      >
        <slot name="description">
          {{ description }}
        </slot>
      </p>

      <slot />
    </div>

    <div
      v-if="$slots.actions"
      class="c-empty-state__actions"
    >
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.c-empty-state {
  @include flex-start-stretch($direction: column);

  gap: var(--space-card-gap);

  @include border-base($opacity: 30%);

  align-items: center;
  justify-content: center;

  width: 100%;
  padding: var(--space-layout-pad) var(--space-card-pad);

  text-align: center;

  &__icon-wrapper {
    @include flex-center-center;

    width: var(--size-control-lg);
    height: var(--size-control-lg);

    @include border-base(var(--color-text-muted), 30%);

    color: var(--color-text-muted);

    @include shadow("sink");
  }

  &__icon {
    opacity: 0.6;
  }

  &__content {
    @include flex-start-stretch($direction: column);

    gap: var(--space-stack-gap-sm);
    align-items: center;
    max-width: 420px;
  }

  &__title {
    @include text-title("sm");

    color: var(--color-text-secondary);
  }

  &__desc {
    @include text-desc;

    color: var(--color-text-muted);
  }

  &__actions {
    @include flex-center-center;

    gap: var(--space-inline-gap);
    margin-top: var(--space-control-py-sm);
  }
}
</style>
