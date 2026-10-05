<script setup lang="ts">
/**
 * Avatar
 * Geist デザインシステム準拠のアバターコンポーネント。
 * ユーザー、チーム、現場等の視覚的シンボル（画像またはイニシャル文字）を真円（Circle）で表示します。
 */
import { computed, ref, watch } from 'vue'

import type { AvatarProps } from '~/types/components'

const {
  src,
  alt = '',
  text,
  size = 'md',
} = defineProps<AvatarProps>()

const hasImageError = ref(false)

// src が変更されたらエラー状態をリセット
watch(() => src, () => {
  hasImageError.value = false
})

const handleImageError = () => {
  hasImageError.value = true
}

const isImageVisible = computed(() => Boolean(src) && !hasImageError.value)

/**
 * フォールバック表示用テキスト（1〜2文字の大文字）
 */
const fallbackText = computed(() => {
  if (!text) return ''

  const trimmed = text.trim()

  // 英数字の場合は単語頭文字または先頭2文字を大文字化
  if (/^[A-Za-z0-9\s_-]+$/.test(trimmed)) {
    const words = trimmed.split(/\s+/).filter(Boolean)

    const first = words[0]
    const second = words[1]

    if (first && second) {
      return (first.charAt(0) + second.charAt(0)).toUpperCase()
    }

    return trimmed.slice(0, 2).toUpperCase()
  }

  // 日本語等の全角文字は先頭最大2文字（姓・名など）
  return trimmed.slice(0, 2)
})
</script>

<template>
  <span class="avatar inline-flex shrink-0 items-center justify-center overflow-hidden" :class="`avatar--${size}`">
    <img v-if="isImageVisible" :src="src" :alt="alt" class="avatar-img w-full h-full object-cover" @error="handleImageError">
    <span v-else-if="fallbackText" class="avatar-text">{{ fallbackText }}</span>
    <Icon v-else name="user" class="avatar-fallback-icon" />
  </span>
</template>

<style scoped lang="scss">
.avatar {
  border: var(--border-width-base) solid var(--color-border);
  border-radius: var(--radius-circle);
  color: var(--color-text-main);
  background-color: var(--surface-bg-elevated);

  // --- Sizes ---
  &--sm {
    width: var(--space-6);
    height: var(--space-6);
    font-size: var(--font-size-2xs);
  }

  &--md {
    width: var(--space-8);
    height: var(--space-8);
    font-size: var(--font-size-xs);
  }

  &--lg {
    width: var(--space-10);
    height: var(--space-10);
    font-size: var(--font-size-sm);
  }

  .avatar-text {
    user-select: none;

    font-family: var(--font-mono);
    font-weight: var(--font-weight-semibold);
    line-height: 1;
    text-transform: uppercase;
    letter-spacing: var(--tracking-wide);
  }

  .avatar-fallback-icon {
    font-size: 1.1em;
    color: var(--color-text-muted);
  }
}
</style>
