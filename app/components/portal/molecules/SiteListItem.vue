<script setup lang="ts">
/**
 * SiteListItem
 * [Portal Molecules] 現場一覧の1現場カードアイテム。
 * 選択状態のハイライト、現場名、ID、ステータスバッジ、有効/無効化操作を提供します。
 */
import type { Site } from '~/types/admin'

defineProps<{
  site: Site
  isSelected?: boolean
}>()

const emit = defineEmits<{
  'select': [site: Site]
  'toggle-disable': [site: Site]
}>()
</script>

<template>
  <Panel
    interactive
    :selected="isSelected"
    class="site-item flex items-center justify-between gap-3 p-3 w-full"
    :class="{ 'site-item--disabled': site.disabledAt }"
    @click="emit('select', site)"
  >
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-1">
        <span class="site-name">
          {{ site.name }}
        </span>
        <Badge :id="`site:${site.status}`" />
        <Badge v-if="site.disabledAt" id="site:disabled" />
      </div>
      <div class="site-id">
        ID: {{ site.id }}
      </div>
    </div>

    <Button
      class="shrink-0 action-btn"
      :variant="site.disabledAt ? 'success' : 'danger'"
      @click.stop="emit('toggle-disable', site)"
    >
      {{ site.disabledAt ? '有効化' : '無効化' }}
    </Button>
  </Panel>
</template>

<style scoped lang="scss">
.site-item {
  &--disabled {
    opacity: 0.6;
  }

  .site-name {
    overflow: hidden;

    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .site-id {
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }

  .action-btn {
    font-size: var(--font-size-xs);
  }
}
</style>
