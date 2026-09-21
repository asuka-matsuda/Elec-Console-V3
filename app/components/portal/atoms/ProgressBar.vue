<script setup lang="ts">
/**
 * ProgressBar
 * [Portal Atoms] プログレスバーコンポーネント（最小パーツ）
 */
const {
  value = 0,
  color = 'var(--color-status-success)',
} = defineProps<{
  /** 進捗率 (0〜100) */
  value?: number
  color?: string
}>()
</script>

<template>
  <div class="progress-track h-2 w-full overflow-hidden">
    <div
      class="progress-fill h-full"
      :style="{
        width: `${Math.min(100, Math.max(0, value))}%`,
        backgroundColor: color,
      }"
    />
  </div>
</template>

<style scoped lang="scss">
.progress-track {
  background-color: var(--color-track-bg);
}

.progress-fill {
  transition: width var(--transition-base, 0.3s ease-out);
}
</style>
