<script setup lang="ts">
/**
 * AtomsCalEventBadge
 * [Atoms] カレンダーイベント表示用の発光バッジコンポーネント。
 * 通常時はダークトーン、ホバー時は設定色に追従した多層アンビエントグローで鮮やかに発光します。
 */
defineProps<{
  title: string
  timeText?: string
  color?: string
}>()
</script>

<template>
  <div
    class="cal-badge relative z-[1] flex items-center gap-1 w-full px-1.5 py-0.5 overflow-hidden"
    :style="{
      '--badge-color': color || 'var(--theme-accent)',
      '--glow-color': color || 'var(--theme-accent)',
    }"
  >
    <span
      v-if="timeText"
      class="cal-badge-time shrink-0"
    >
      {{ timeText }}
    </span>
    <span class="cal-badge-title min-w-0 flex-1">
      {{ title }}
    </span>
  </div>
</template>

<style scoped lang="scss">
.cal-badge {
  cursor: pointer;
  user-select: none;

  border: var(--border-width-base) solid color-mix(in srgb, var(--badge-color) 40%, transparent);

  background: color-mix(in srgb, var(--badge-color) 8%, var(--surface-bg-elevated));
  box-shadow: none;

  transition: var(--transition-interactive);

  &:hover {
    border-color: color-mix(in srgb, var(--badge-color) 85%, transparent);
    background: color-mix(in srgb, var(--badge-color) 20%, var(--surface-bg-elevated));
    box-shadow: var(--shadow-glow-hover);

    .cal-badge-time {
      color: var(--badge-color);
    }
  }
}

.cal-badge-time {
  font-family: var(--font-mono);
  font-size: var(--font-size-2xs);
  font-weight: var(--font-weight-bold);
  font-variant-numeric: tabular-nums;
  color: color-mix(in srgb, var(--badge-color) 70%, var(--color-text-muted));
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);

  transition: var(--transition-interactive);
}

.cal-badge-title {
  overflow: hidden;

  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  font-variant-numeric: tabular-nums;
  color: var(--color-text-main);
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
