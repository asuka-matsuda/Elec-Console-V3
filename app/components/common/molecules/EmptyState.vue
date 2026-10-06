<script setup lang="ts">
/**
 * EmptyState (Geist準拠)
 * [Molecules] データが0件の場合や未選択状態、権限制限、検索結果なしを分かりやすく伝えるコンポーネント。
 * - Vercel Geist 仕様: アイコン枠サーフェス、タイトル・説明文のテキストバランス、直角外枠
 * - 6系統のバリアント: default, no-results, informational, cleared, permission, error
 * - 3系統のサイズ: sm, md, lg
 */
import type { EmptyStateProps } from '~/types/components'

const {
  icon,
  title,
  description,
  variant = 'default',
  size = 'md',
  bordered = false,
  spin = false,
} = defineProps<EmptyStateProps>()
</script>

<template>
  <div class="empty-state flex flex-col items-center justify-center text-center" :class="[`is-${variant}`, `is-${size}`, { 'is-bordered': bordered }]">
    <div v-if="icon || $slots.icon" class="icon-surface flex shrink-0 items-center justify-center">
      <slot name="icon">
        <Icon v-if="icon" :name="icon" :spin="spin" class="state-icon" />
      </slot>
    </div>

    <div v-if="title || description || $slots.title || $slots.description" class="text-group flex flex-col items-center">
      <p v-if="title || $slots.title" class="title">
        <slot name="title">{{ title }}</slot>
      </p>

      <p v-if="description || $slots.description" class="desc">
        <slot name="description">{{ description }}</slot>
      </p>
    </div>

    <div v-if="$slots.default || $slots.actions" class="actions flex items-center justify-center flex-wrap">
      <slot name="actions">
        <slot />
      </slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
.empty-state {
  box-sizing: border-box;
  width: 100%;
  border-radius: 0;

  &.is-sm {
    gap: var(--space-3);
    padding: var(--space-4) var(--space-3);

    .icon-surface {
      width: 36px;
      height: 36px;
      font-size: var(--font-size-base);
    }

    .title {
      font-size: var(--font-size-sm);
    }

    .desc {
      font-size: var(--font-size-xs);
    }

    .text-group {
      gap: var(--space-1);
    }

    .actions {
      gap: var(--space-2);
      margin-top: var(--space-1);
    }
  }

  &.is-md {
    gap: var(--space-4);
    padding: var(--space-8) var(--space-4);

    .icon-surface {
      width: 48px;
      height: 48px;
      font-size: var(--font-size-lg);
    }

    .title {
      font-size: var(--font-size-base);
    }

    .desc {
      font-size: var(--font-size-sm);
    }

    .text-group {
      gap: var(--space-2);
    }

    .actions {
      gap: var(--space-3);
      margin-top: var(--space-2);
    }
  }

  &.is-lg {
    gap: var(--space-6);
    padding: var(--space-12) var(--space-6);

    .icon-surface {
      width: 60px;
      height: 60px;
      font-size: var(--font-size-xl);
    }

    .title {
      font-size: var(--font-size-md);
    }

    .desc {
      font-size: var(--font-size-sm);
    }

    .text-group {
      gap: var(--space-2);
    }

    .actions {
      gap: var(--space-4);
      margin-top: var(--space-3);
    }
  }

  &.is-bordered {
    border: var(--border-width-base, 1px) dashed var(--color-border);
    background-color: var(--surface-bg-solid);
  }
}

.icon-surface {
  border: var(--border-width-base, 1px) solid var(--color-border-subtle);
  border-radius: 0;

  color: var(--color-text-secondary);

  background-color: var(--surface-bg-solid);
  box-shadow: var(--shadow-elevation-sm);

  transition: border-color var(--duration-fast, 150ms) var(--ease-base, ease-out);

  .is-no-results & {
    border-color: var(--color-border);
    color: var(--color-text-secondary);
  }

  .is-cleared & {
    border-color: color-mix(in srgb, var(--color-status-success) 40%, transparent);
    color: var(--color-status-success);
    background-color: color-mix(in srgb, var(--color-status-success) 8%, var(--surface-bg-solid));
  }

  .is-permission & {
    border-color: color-mix(in srgb, var(--color-status-warning) 40%, transparent);
    color: var(--color-status-warning);
    background-color: color-mix(in srgb, var(--color-status-warning) 8%, var(--surface-bg-solid));
  }

  .is-error & {
    border-color: color-mix(in srgb, var(--color-status-danger) 40%, transparent);
    color: var(--color-status-danger);
    background-color: color-mix(in srgb, var(--color-status-danger) 8%, var(--surface-bg-solid));
  }

  .is-informational & {
    border-color: color-mix(in srgb, var(--color-category-main) 40%, transparent);
    color: var(--color-category-main);
    background-color: color-mix(in srgb, var(--color-category-main) 8%, var(--surface-bg-solid));
  }
}

.text-group {
  max-width: 420px;
}

.title {
  margin: 0;

  font-weight: var(--font-weight-semibold, 600);
  line-height: var(--line-height-tight);
  color: var(--color-text-main);
  text-wrap: balance;
}

.desc {
  margin: 0;
  line-height: var(--line-height-base);
  color: var(--color-text-secondary);
  text-wrap: balance;
}
</style>
