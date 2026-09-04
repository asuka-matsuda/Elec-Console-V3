<script setup lang="ts">
/**
 * AppPanel
 * ヘッダーや枠線（サイバー風のブラケットなど）を持ち、コンテンツを囲むパネルコンポーネント。
 */
withDefaults(
  defineProps<{
    title?: string
    icon?: string
    size?: 'sm' | 'md' | 'lg'
    tag?: string
    dividerType?: 'default' | 'fade-side' | 'fade-center'
    variant?:
      | 'main'
      | 'tool'
      | 'database'
      | 'reference'
      | 'management'
      | 'danger'
      | 'success'
      | 'hud'
      | 'simple'
  }>(),
  {
    size: 'md',
    tag: 'h3',
    dividerType: 'fade-center',
  },
)
</script>

<template>
  <section class="c-panel">
    <slot name="header">
      <AppSectionHeader
        v-if="title"
        :title="title"
        :icon="icon"
        :variant="variant"
        :size="size"
        :tag="tag"
        :divider-type="dividerType"
      >
        <template v-if="$slots.actions" #actions>
          <slot name="actions" />
        </template>
      </AppSectionHeader>
    </slot>

    <div class="c-panel__content">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="c-panel__footer">
      <slot name="footer" />
    </footer>
  </section>
</template>

<style scoped lang="scss">
.c-panel {
  @include flex-start-stretch($direction: column);

  position: relative;
  gap: var(--space-card-gap);
  padding: var(--space-card-pad);

  @include border-base($color: var(--color-border), $opacity: 100%);
  @include state-base("sm");

  &__content {
    @include flex-start-stretch($direction: column);

    flex: 1;
    gap: var(--space-card-gap);
    min-height: 0;
  }

  &__footer {
    @include flex-end-center;

    gap: var(--space-2);
  }
}
</style>
