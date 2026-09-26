<script setup lang="ts">
/**
 * PanelGlossary
 * [Reference Molecules] 用語集の単一用語を表示するパネルコンポーネント。
 */
import type { BadgePresetId } from '~/types/components'

export interface GlossaryItem {
  term: string
  kana?: string
  category: string
  desc: string
  related?: string
  example?: string
}

defineProps<{
  item: GlossaryItem
  badgeId?: BadgePresetId
}>()
</script>

<template>
  <Panel as="article" class="flex flex-col gap-panel-gap">
    <header class="flex items-center justify-between gap-item-gap">
      <div class="flex flex-col gap-inline-gap">
        <span v-if="item.kana" class="kana">{{ item.kana }}</span>
        <h2 class="term m-0">
          {{ item.term }}
        </h2>
      </div>
      <Badge
        v-if="badgeId"
        :id="badgeId"
      >
        {{ item.category }}
      </Badge>
    </header>

    <Divider type="fade-center" />

    <div class="flex flex-col gap-inline-gap">
      <p class="desc m-0">
        {{ item.desc }}
      </p>

      <aside v-if="item.related" class="meta flex flex-col gap-inline-gap p-panel-pad-compact">
        <span class="meta-label">関連用語</span>
        <p class="meta-text m-0">
          {{ item.related }}
        </p>
      </aside>

      <aside v-if="item.example" class="meta flex flex-col gap-inline-gap p-panel-pad-compact">
        <span class="meta-label">用例・備考</span>
        <p class="meta-text m-0">
          {{ item.example }}
        </p>
      </aside>
    </div>
  </Panel>
</template>

<style scoped lang="scss">
.kana {
  font-size: var(--font-size-2xs);
  color: var(--color-text-muted);
}

.term {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-main);
}

.desc {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--color-text-secondary);
}

.meta {
  border: var(--border-width-base) solid color-mix(in srgb, var(--color-border) 30%, transparent);
}

.meta-label {
  font-size: var(--font-size-2xs);
  color: var(--color-text-muted);
}

.meta-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
</style>
